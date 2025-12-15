import asyncio
import json
import logging
import re
import shlex
from collections.abc import AsyncIterable, AsyncIterator
from contextlib import suppress
from dataclasses import asdict
from types import TracebackType
from typing import Any, Self

from claude_agent_sdk._errors import (
    CLIConnectionError,
    CLIJSONDecodeError,
    ProcessError,
)
from claude_agent_sdk._internal.transport import Transport
from claude_agent_sdk._version import __version__ as sdk_version
from claude_agent_sdk.types import ClaudeAgentOptions
from e2b import AsyncSandbox
from e2b.sandbox.commands.command_handle import CommandExitException
from e2b.sandbox_async.commands.command_handle import AsyncCommandHandle

from app.services.sandbox import SANDBOX_AUTO_PAUSE_TIMEOUT

_DEFAULT_MAX_BUFFER_SIZE = 1024 * 1024 * 10  # 10MB
_STDOUT_QUEUE_MAXSIZE = 32
_ANSI_ESCAPE_RE = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")

logger = logging.getLogger(__name__)


class E2BSandboxTransport(Transport):
    _SENTINEL = object()

    def __init__(
        self,
        *,
        sandbox_id: str,
        api_key: str,
        prompt: str | AsyncIterable[dict[str, Any]],
        options: ClaudeAgentOptions,
    ) -> None:
        self._sandbox_id = sandbox_id
        self._api_key = api_key
        self._prompt = prompt
        self._options = options
        self._is_streaming = True
        self._max_buffer_size = (
            options.max_buffer_size
            if options.max_buffer_size is not None
            else _DEFAULT_MAX_BUFFER_SIZE
        )
        self._json_decoder = json.JSONDecoder()
        self._sandbox: AsyncSandbox | None = None
        self._command: AsyncCommandHandle | None = None
        self._monitor_task: asyncio.Task[None] | None = None
        self._stdout_queue: asyncio.Queue[str | object] = asyncio.Queue(
            maxsize=_STDOUT_QUEUE_MAXSIZE
        )
        self._ready = False
        self._exit_error: Exception | None = None
        self._stdin_closed = False

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> bool:
        try:
            await self.close()
        except Exception as cleanup_error:
            logger.error(
                f"Error during E2BSandboxTransport cleanup: {cleanup_error}",
                exc_info=True,
            )
            if exc_type is None:
                raise
        return False

    async def connect(self) -> None:
        if self._ready:
            return
        self._stdin_closed = False
        try:
            self._sandbox = await AsyncSandbox.connect(
                sandbox_id=self._sandbox_id,
                api_key=self._api_key,
                auto_pause=True,
                timeout=SANDBOX_AUTO_PAUSE_TIMEOUT,
            )
        except Exception as exc:
            raise CLIConnectionError(
                f"Failed to connect to sandbox {self._sandbox_id}: {exc}"
            ) from exc

        command_line = self._build_command()
        envs = {
            "CLAUDE_CODE_ENTRYPOINT": "sdk-py",
            "CLAUDE_AGENT_SDK_VERSION": sdk_version,
            "CLAUDE_CODE_SANDBOX": "1",
            "PYTHONUNBUFFERED": "1",
        }
        envs.update(self._options.env or {})
        cwd = str(self._options.cwd) if self._options.cwd else "/home/user"
        user = self._options.user or "user"

        async def on_stdout(data: str) -> None:
            await self._stdout_queue.put(data)

        async def on_stderr(data: str) -> None:
            if self._options.stderr:
                try:
                    self._options.stderr(data)
                except Exception:  # pragma: no cover - defensive
                    pass

        try:
            assert self._sandbox is not None
            self._command = await self._sandbox.commands.run(
                command_line,
                background=True,
                envs={key: str(value) for key, value in envs.items()},
                cwd=cwd,
                user=user,
                timeout=0,  # Do not auto-disconnect long-lived process
                on_stdout=on_stdout,
                on_stderr=on_stderr,
            )
        except Exception as exc:
            raise CLIConnectionError(f"Failed to start Claude CLI: {exc}") from exc
        loop = asyncio.get_running_loop()
        self._monitor_task = loop.create_task(self._monitor_process())
        self._ready = True

    async def close(self) -> None:
        self._ready = False
        if self._monitor_task:
            self._monitor_task.cancel()
            with suppress(asyncio.CancelledError):
                await self._monitor_task
            self._monitor_task = None
        if self._command:
            with suppress(Exception):
                await self._command.kill()
            self._command = None
        self._stdin_closed = False
        try:
            self._stdout_queue.put_nowait(self._SENTINEL)
        except asyncio.QueueFull:
            pass

    async def write(self, data: str) -> None:
        if not self._ready or not self._command or not self._sandbox:
            raise CLIConnectionError("Transport is not ready for writing")
        if self._stdin_closed:
            raise CLIConnectionError("Cannot write after input has been closed")
        try:
            await self._sandbox.commands.send_stdin(self._command.pid, data)
        except Exception as exc:
            self._exit_error = CLIConnectionError(
                f"Failed to send data to Claude CLI: {exc}"
            )
            raise self._exit_error

    def read_messages(self) -> AsyncIterator[dict[str, Any]]:
        return self._parse_cli_output()

    async def end_input(self) -> None:
        if not self._ready or not self._command or not self._sandbox:
            return
        if self._stdin_closed:
            return
        try:
            await self._sandbox.commands.send_stdin(self._command.pid, "\u0004")
            self._stdin_closed = True
        except Exception:
            pass

    def is_ready(self) -> bool:
        return self._ready

    async def _parse_cli_output(self) -> AsyncIterator[dict[str, Any]]:
        # Stream-based JSON parser that processes Claude CLI output incrementally.
        # The CLI outputs newline-delimited JSON messages, but terminal output may contain
        # ANSI escape codes (colors, cursor movement) that must be stripped before parsing.
        # Uses a state machine: json_started tracks if we've found the first '{' or '[',
        # allowing us to skip any non-JSON preamble from the CLI startup.
        if not self._ready and not self._monitor_task:
            raise CLIConnectionError("Transport is not connected")
        json_buffer = ""
        json_started = False
        should_stop = False
        while True:
            chunk = await self._stdout_queue.get()

            if chunk is self._SENTINEL:
                break
            if not isinstance(chunk, str):
                continue

            # Strip ANSI escape codes (e.g., \x1B[32m for colors) that terminals inject.
            # These codes break JSON parsing if not removed.
            clean_chunk = _ANSI_ESCAPE_RE.sub("", chunk)
            clean_chunk = clean_chunk.replace("\r", "")

            json_lines = clean_chunk.split("\n")
            for json_line in json_lines:
                json_line = json_line.strip()
                if not json_line:
                    continue
                if not json_started:
                    first_brace_positions = [
                        pos
                        for pos in (json_line.find("{"), json_line.find("["))
                        if pos != -1
                    ]
                    if not first_brace_positions:
                        continue
                    json_line = json_line[min(first_brace_positions) :]
                    json_started = True
                if not json_started:
                    continue
                json_buffer += json_line
                if len(json_buffer) > self._max_buffer_size:
                    json_buffer = ""
                    raise CLIJSONDecodeError(
                        json_line,
                        ValueError(
                            f"CLI output exceeded max buffer size of {self._max_buffer_size}"
                        ),
                    )
                json_buffer, parsed_messages = self._parse_json_buffer(json_buffer)
                if parsed_messages:
                    for data in parsed_messages:
                        yield data
                        if isinstance(data, dict) and data.get("type") == "result":
                            json_buffer = ""
                            should_stop = True
                            break
                    if not json_buffer:
                        json_started = False
                if should_stop:
                    break
            if should_stop:
                break
        if json_buffer:
            leftover, parsed_messages = self._parse_json_buffer(json_buffer)
            for data in parsed_messages:
                yield data
            if leftover.strip():
                try:
                    json.loads(leftover)
                except json.JSONDecodeError as exc:
                    raise CLIJSONDecodeError(leftover, exc) from exc
        if self._exit_error:
            raise self._exit_error

    def _parse_json_buffer(self, buffer: str) -> tuple[str, list[Any]]:
        # Parses concatenated JSON objects from a buffer, returning unparsed remainder.
        # Uses raw_decode instead of json.loads because the buffer may contain multiple
        # JSON objects back-to-back (e.g., '{"a":1}{"b":2}'). json.loads would fail on this,
        # but raw_decode returns the offset where parsing stopped, allowing us to extract
        # each object one at a time and preserve any incomplete trailing data for the next chunk.
        messages: list[Any] = []
        working = buffer
        while working:
            stripped = working.lstrip()
            leading = len(working) - len(stripped)
            if leading:
                working = stripped
            try:
                data, offset = self._json_decoder.raw_decode(working)
            except json.JSONDecodeError:
                break
            messages.append(data)
            working = working[offset:]
        return working, messages

    async def _monitor_process(self) -> None:
        if not self._command:
            return
        try:
            await self._command.wait()
        except CommandExitException as exc:
            self._exit_error = ProcessError(
                "Claude CLI exited with an error",
                exit_code=exc.exit_code,
                stderr=exc.stderr,
            )
        except Exception as exc:  # pragma: no cover - defensive
            self._exit_error = CLIConnectionError(
                f"Claude CLI stopped unexpectedly: {exc}"
            )
        finally:
            try:
                await self._stdout_queue.put(self._SENTINEL)
            except asyncio.CancelledError:  # pragma: no cover - defensive
                pass
            except Exception:
                pass
            self._ready = False

    def _build_command(self) -> str:
        cli_binary = str(self._options.cli_path) if self._options.cli_path else "claude"
        cmd = [cli_binary, "--output-format", "stream-json", "--verbose"]
        if self._options.system_prompt is None:
            pass
        elif isinstance(self._options.system_prompt, str):
            cmd.extend(["--system-prompt", self._options.system_prompt])
        else:
            if (
                self._options.system_prompt.get("type") == "preset"
                and "append" in self._options.system_prompt
            ):
                cmd.extend(
                    ["--append-system-prompt", self._options.system_prompt["append"]]
                )
        if self._options.allowed_tools:
            cmd.extend(["--allowedTools", ",".join(self._options.allowed_tools)])
        if self._options.max_turns:
            cmd.extend(["--max-turns", str(self._options.max_turns)])
        if self._options.disallowed_tools:
            cmd.extend(["--disallowedTools", ",".join(self._options.disallowed_tools)])
        if self._options.model:
            cmd.extend(["--model", self._options.model])
        if self._options.permission_prompt_tool_name:
            cmd.extend(
                [
                    "--permission-prompt-tool",
                    self._options.permission_prompt_tool_name,
                ]
            )
        if self._options.permission_mode:
            cmd.extend(["--permission-mode", self._options.permission_mode])
        if self._options.continue_conversation:
            cmd.append("--continue")
        if self._options.resume:
            cmd.extend(["--resume", self._options.resume])
        if self._options.settings:
            cmd.extend(["--settings", self._options.settings])
        for directory in self._options.add_dirs:
            cmd.extend(["--add-dir", str(directory)])
        if self._options.mcp_servers:
            if isinstance(self._options.mcp_servers, dict):
                servers_for_cli: dict[str, Any] = {}
                for name, config in self._options.mcp_servers.items():
                    if isinstance(config, dict) and config.get("type") == "sdk":
                        servers_for_cli[name] = {
                            key: value
                            for key, value in config.items()
                            if key != "instance"
                        }
                    else:
                        servers_for_cli[name] = config
                if servers_for_cli:
                    cmd.extend(
                        [
                            "--mcp-config",
                            json.dumps({"mcpServers": servers_for_cli}),
                        ]
                    )
            else:
                cmd.extend(["--mcp-config", str(self._options.mcp_servers)])
        if self._options.include_partial_messages:
            cmd.append("--include-partial-messages")
        if self._options.fork_session:
            cmd.append("--fork-session")
        if self._options.max_thinking_tokens:
            cmd.extend(
                ["--max-thinking-tokens", str(self._options.max_thinking_tokens)]
            )
        if self._options.agents:
            agents_dict = {
                name: {k: v for k, v in asdict(agent_def).items() if v is not None}
                for name, agent_def in self._options.agents.items()
            }
            cmd.extend(["--agents", json.dumps(agents_dict)])
        sources_value = (
            ",".join(self._options.setting_sources)
            if self._options.setting_sources is not None
            else ""
        )
        cmd.extend(["--setting-sources", sources_value])
        for flag, value in self._options.extra_args.items():
            if value is None:
                cmd.append(f"--{flag}")
            else:
                cmd.extend([f"--{flag}", str(value)])
        # Always use streaming mode for E2B
        cmd.extend(["--input-format", "stream-json"])
        return shlex.join(cmd)
