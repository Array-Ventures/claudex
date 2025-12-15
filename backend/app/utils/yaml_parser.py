import re
from typing import cast

import yaml

from app.models.types import YamlFrontmatterResult, YamlMetadata


def normalize_yaml_frontmatter(content: str) -> str:
    # Auto-quotes YAML values containing colons that would otherwise break parsing.
    # E.g., 'description: Build a CLI tool: fast and simple' becomes
    # 'description: "Build a CLI tool: fast and simple"'. Skips values already quoted
    # or using YAML multiline syntax (|, >).
    lines = content.split("\n")

    if not lines or lines[0].strip() != "---":
        return content

    yaml_end = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            yaml_end = i
            break

    if yaml_end is None:
        return content

    yaml_lines = lines[1:yaml_end]
    normalized_lines = [lines[0]]

    i = 0
    while i < len(yaml_lines):
        line = yaml_lines[i]

        if re.match(r"^(description|name|model|allowed_tools):\s*", line):
            field_name = line.split(":", 1)[0]
            value_part = line.split(":", 1)[1].strip() if ":" in line else ""

            if field_name in ["description", "name"] and value_part:
                if not (
                    value_part.startswith('"')
                    or value_part.startswith("'")
                    or value_part.startswith("|")
                    or value_part.startswith(">")
                ):
                    if ":" in value_part:
                        value_part = value_part.replace('"', '\\"')
                        line = f'{field_name}: "{value_part}"'

        normalized_lines.append(line)
        i += 1

    normalized_lines.extend(lines[yaml_end:])
    return "\n".join(normalized_lines)


def parse_yaml_frontmatter(content: str) -> YamlFrontmatterResult:
    lines = content.split("\n")

    if not lines or lines[0].strip() != "---":
        raise ValueError("Content must start with YAML frontmatter (---)")

    yaml_end = None
    for i, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            yaml_end = i
            break

    if yaml_end is None:
        raise ValueError("YAML frontmatter must end with ---")

    normalized_content = normalize_yaml_frontmatter(content)
    normalized_lines = normalized_content.split("\n")
    yaml_content = "\n".join(normalized_lines[1:yaml_end])
    markdown_content = "\n".join(lines[yaml_end + 1 :]).strip()

    try:
        metadata = yaml.safe_load(yaml_content)
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML frontmatter: {e}")

    if not isinstance(metadata, dict):
        raise ValueError("YAML frontmatter must be a dictionary")

    return {
        "metadata": cast(YamlMetadata, metadata),
        "markdown_content": markdown_content,
    }
