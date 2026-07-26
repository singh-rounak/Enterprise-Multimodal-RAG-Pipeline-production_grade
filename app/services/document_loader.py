from __future__ import annotations

from pathlib import Path
from typing import Dict

import fitz  # PyMuPDF

from app.core.logging import logger


class DocumentLoader:
    """
    Handles reading documents and extracting text.

    Supported formats:
    - PDF
    - TXT
    - Markdown

    Future:
    - DOCX
    - HTML
    - CSV
    - PPTX
    """

    SUPPORTED_EXTENSIONS = {
        ".pdf",
        ".txt",
        ".md",
    }

    def load(self, file_path: Path) -> Dict:
        """
        Detect file type and extract text.

        Returns:
        {
            "filename": "...",
            "extension": ".pdf",
            "text": "...",
            "metadata": {...}
        }
        """

        extension = file_path.suffix.lower()

        if extension not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type: {extension}"
            )

        if extension == ".pdf":
            return self._load_pdf(file_path)

        if extension == ".txt":
            return self._load_text(file_path)

        if extension == ".md":
            return self._load_markdown(file_path)

        raise ValueError("Unsupported document type.")

    # -------------------------------------------------------
    # PDF
    # -------------------------------------------------------

    def _load_pdf(self, file_path: Path) -> Dict:

        logger.info(f"Loading PDF: {file_path.name}")

        document = fitz.open(file_path)

        pages = []
        full_text = ""

        for page_number, page in enumerate(document):

            page_text = page.get_text()

            pages.append(
                {
                    "page": page_number + 1,
                    "text": page_text,
                }
            )

            full_text += page_text + "\n"

        document.close()

        return {
            "filename": file_path.name,
            "extension": ".pdf",
            "text": full_text,
            "metadata": {
                "pages": len(pages),
                "page_details": pages,
            },
        }

    # -------------------------------------------------------
    # TXT
    # -------------------------------------------------------

    def _load_text(self, file_path: Path) -> Dict:

        logger.info(f"Loading TXT: {file_path.name}")

        text = file_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

        return {
            "filename": file_path.name,
            "extension": ".txt",
            "text": text,
            "metadata": {},
        }

    # -------------------------------------------------------
    # Markdown
    # -------------------------------------------------------

    def _load_markdown(self, file_path: Path) -> Dict:

        logger.info(f"Loading Markdown: {file_path.name}")

        text = file_path.read_text(
            encoding="utf-8",
            errors="ignore",
        )

        return {
            "filename": file_path.name,
            "extension": ".md",
            "text": text,
            "metadata": {},
        }