from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.db_models import UserSettings


def _get_github_section(github_token_configured: bool) -> str:
    if not github_token_configured:
        return ""
    return """
<github_integration>
- Use `gh` CLI for GitHub operations (PRs, issues, API)
- Examples: `gh pr list`, `gh pr view 193 --json number,title,body,headRefName,baseRefName,commits`, `gh pr diff 193` (where 193 is PR number)
- Commit messages should reference test/issue IDs when applicable
</github_integration>
"""


def _get_env_vars_section(env_vars_formatted: str | None) -> str:
    if not env_vars_formatted:
        return ""
    return f"""

<available_env_variables>
- Available custom environment variables: {env_vars_formatted}
- Use these directly without prompting users for API keys or credentials
- Already set in the sandbox environment and ready for immediate use
</available_env_variables>
"""


def get_system_prompt(
    sandbox_id: str,
    github_token_configured: bool = False,
    env_vars_formatted: str | None = None,
) -> str:
    current_date = datetime.utcnow().strftime("%Y-%m-%d")
    github_section = _get_github_section(github_token_configured)
    env_section = _get_env_vars_section(env_vars_formatted)

    return f"""
<runtime_context>
- Workspace: /home/user
- Sandbox: {sandbox_id}
- Date: {current_date}
- Public URL pattern: https://<port>-{sandbox_id}.e2b.dev
</runtime_context>

<anti_patterns>
- Extra comments that a human wouldn't add or is inconsistent with the rest of the file
- Extra defensive checks or try/except blocks that are abnormal for the area of the codebase especially if called by trusted/validated codepaths
- Import packages inside functions instead of the top file
- Casts to any or using any workarounds to get around type issues
- Any other coding patterns that are not consistent with the file and project
- Hardcoding values that should come from config or environment variables
- Over-engineering simple solutions or adding unnecessary abstractions
- Duplicating code when existing utilities or helpers already exist in the codebase
- Adding unused imports or dead code
- Using deprecated APIs or packages without checking for modern alternatives
</anti_patterns>

<best_practices>
- When working on a new project, the `.e2b.dev` should be added to allowedHosts and similar config otherwise the requests will be blocked
- Web Search and Web Fetch should be used frequently to get the latest updates and remember to use the current date from <runtime_context>
- We can render Mermaid diagrams directly in the browser so recommended to use it frequently to explain things
- Check existing codebase patterns and utilities before implementing new solutions
- Keep changes minimal and focused on the specific task
- Validate and sanitize user input at system boundaries (API endpoints, external data)
- Run existing tests/linters after making changes to catch regressions
- Use descriptive variable and function names that match the project's naming conventions
</best_practices>

{github_section}

{env_section}
"""


def build_system_prompt_for_chat(
    sandbox_id: str, user_settings: "UserSettings | None"
) -> str:
    github_token_configured = bool(
        user_settings and user_settings.github_personal_access_token
    )
    env_vars_formatted = None
    if user_settings and user_settings.custom_env_vars:
        env_vars_formatted = "\n".join(
            f"- {env_var['key']}" for env_var in user_settings.custom_env_vars
        )
    return get_system_prompt(sandbox_id, github_token_configured, env_vars_formatted)
