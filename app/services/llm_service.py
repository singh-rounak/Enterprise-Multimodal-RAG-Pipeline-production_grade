import json
from typing import AsyncGenerator
import httpx

from app.core.config import settings
from app.core.exceptions import LLMException
from app.core.logging import logger


class LLMService:
    """
    Async client around a local Ollama server for text generation & streaming.
    """

    def __init__(self):
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.llm_model
        self.timeout = settings.llm_request_timeout

    async def async_generate_response(self, prompt: str) -> str:
        """
        Sends a prompt asynchronously to Ollama and returns full generated text.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                return response.json()["response"]
        except Exception as exc:
            logger.exception("LLM async generation failed.")
            raise LLMException(
                f"Failed to get a response from Ollama ({self.model}): {exc}"
            ) from exc

    async def generate_response_stream(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Streams response tokens from Ollama asynchronously.
        """
        url = f"{self.base_url}/api/generate"
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream("POST", url, json=payload) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                            token = data.get("response", "")
                            if token:
                                yield token
                        except json.JSONDecodeError:
                            continue
        except Exception as exc:
            logger.exception("LLM response streaming failed.")
            raise LLMException(
                f"LLM streaming failed for model {self.model}: {exc}"
            ) from exc

    def generate_response(self, prompt: str) -> str:
        """
        Synchronous fallback for non-async callers.
        """
        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                return response.json()["response"]
        except Exception as exc:
            logger.exception("LLM generation failed.")
            raise LLMException(
                f"Failed to get a response from Ollama ({self.model}): {exc}"
            ) from exc

    def health(self) -> bool:
        """
        Checks whether the Ollama server is reachable.
        """
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                return True
        except Exception:
            logger.exception("Ollama health check failed.")
            return False

