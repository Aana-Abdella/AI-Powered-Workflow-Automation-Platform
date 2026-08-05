import logging
import re

from openai import OpenAI

from app.core.config import get_settings


logger = logging.getLogger(__name__)


class AIService:
    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.openai_model
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    def summarize(self, text: str) -> str:
        if not self.client:
            return self._fallback_summary(text)

        try:
            response = self.client.responses.create(
                model=self.model,
                input=[
                    {
                        "role": "system",
                        "content": "Summarize the user's text in 2 to 3 concise bullet points.",
                    },
                    {"role": "user", "content": text},
                ],
                max_output_tokens=180,
            )
            summary = getattr(response, "output_text", "").strip()
            if summary:
                return summary
        except Exception as exc:
            logger.warning("OpenAI summarization failed; using fallback", exc_info=exc)

        return self._fallback_summary(text)

    def _fallback_summary(self, text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        if not cleaned:
            return "- No content provided."

        sentences = re.split(r"(?<=[.!?])\s+", cleaned)
        picked = [sentence.strip() for sentence in sentences if sentence.strip()][:3]
        if not picked:
            picked = [cleaned[:220]]
        bullets = "\n".join(f"- {item}" for item in picked)
        return bullets
