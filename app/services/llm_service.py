from __future__ import annotations

import requests

from app.core.config import settings
from app.core.exceptions import LLMException
from app.core.logging import logger


class LLMService:
    """
    Thin client around a local Ollama server for text generation.
    """

    def __init__(self):
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.llm_model
        self.timeout = settings.llm_request_timeout

    def generate_response(self, prompt: str) -> str:
        """
        Sends a prompt to the local Ollama model and returns the generated text.
        """

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()["response"]

        except requests.exceptions.RequestException as exc:
            logger.exception("LLM generation failed.")
            raise LLMException(
                f"Failed to get a response from Ollama ({self.model}): {exc}"
            ) from exc
        except (KeyError, ValueError) as exc:
            logger.exception("Unexpected LLM response format.")
            raise LLMException(
                f"Unexpected response format from Ollama: {exc}"
            ) from exc

    def health(self) -> bool:
        """
        Checks whether the Ollama server is reachable.
        """

        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException:
            logger.exception("Ollama health check failed.")
            return False
