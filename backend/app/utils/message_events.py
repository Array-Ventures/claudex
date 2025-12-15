import json
from typing import cast

from app.models.types import JSONDict


def _parse_event_log(content: str) -> list[JSONDict]:
    if not content or not content.strip():
        return []

    try:
        parsed = json.loads(content.strip())
        if isinstance(parsed, list):
            return cast(list[JSONDict], parsed)
        return []
    except (json.JSONDecodeError, ValueError):
        return []


def _format_code_reviews_for_prompt(reviews: list[JSONDict]) -> str:
    if not reviews:
        return ""

    formatted_reviews: list[str] = []
    for review in reviews:
        file_path = str(review.get("filePath", ""))
        line_start = review.get("lineStart", 0)
        line_end = review.get("lineEnd", 0)
        selected_code = str(review.get("selectedCode", ""))
        comment = str(review.get("comment", ""))

        if not file_path or not comment:
            continue

        line_range = (
            f"line {line_start}"
            if line_start == line_end
            else f"lines {line_start}-{line_end}"
        )

        code_block = f"```\n{selected_code}\n```\n" if selected_code else ""
        review_text = (
            f"File: {file_path} ({line_range})\n{code_block}Comment: {comment}"
        )
        formatted_reviews.append(review_text)

    if not formatted_reviews:
        return ""

    return "\n\n[Code Review Comments]\n\n" + "\n---\n".join(formatted_reviews)


def extract_user_prompt_and_reviews(message_content: str) -> tuple[str, str]:
    events = _parse_event_log(message_content)

    if not events:
        return message_content, ""

    user_text_parts: list[str] = []
    all_reviews: list[JSONDict] = []

    for event in events:
        event_type = event.get("type")

        if event_type == "user_text":
            text = event.get("text", "")
            user_text_parts.append(str(text) if text else "")
        elif event_type == "code_review":
            reviews = event.get("reviews", [])
            if isinstance(reviews, list):
                all_reviews.extend(cast(list[JSONDict], reviews))

    user_prompt = "".join(user_text_parts)
    reviews_text = _format_code_reviews_for_prompt(all_reviews)

    return user_prompt, reviews_text
