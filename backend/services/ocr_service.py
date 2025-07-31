import base64
import io
import logging
from typing import Any

import cv2  # type: ignore[import-untyped]
import fitz  # type: ignore[import-untyped]  # PyMuPDF for PDF handling
import numpy as np
import pytesseract  # type: ignore[import-untyped]
from PIL import Image

logger = logging.getLogger(__name__)

class OCRService:
    """Service for OCR and image processing capabilities"""

    def __init__(self):
        # Check if tesseract is installed
        try:
            pytesseract.get_tesseract_version()
        except Exception as e:
            logger.warning(f"Tesseract not found: {e}. OCR functionality will be limited.")

    async def extract_text_from_image(self, image_path: str) -> dict[str, Any]:
        """Extract text from an image file using OCR"""
        try:
            # Load and preprocess image
            image = cv2.imread(image_path)
            # cv2.imread can return None, but Pylance doesn't know this
            if image is None:  # type: ignore[comparison-overlap]
                return {"error": "Could not load image", "text": ""}

            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Apply thresholding to preprocess the image
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]

            # Perform OCR
            text: str = pytesseract.image_to_string(thresh, lang='eng')  # type: ignore

            # Also get detailed data
            data: dict[str, list[Any]] = pytesseract.image_to_data(thresh, output_type=pytesseract.Output.DICT)  # type: ignore

            # Extract confidence scores
            confidences = [int(str(conf)) for conf in data['conf'] if conf and int(str(conf)) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0

            return {
                "text": text.strip(),
                "confidence": avg_confidence,
                "word_count": len(text.split()),
                "language": "en",
                "success": True
            }

        except Exception as e:
            logger.error(f"OCR error: {e}")
            return {
                "error": str(e),
                "text": "",
                "success": False
            }

    async def extract_text_from_pdf(self, pdf_path: str) -> dict[str, Any]:
        """Extract text from PDF, including scanned PDFs"""
        try:
            pdf_document = fitz.open(pdf_path)  # type: ignore
            all_text: list[dict[str, Any]] = []
            total_pages = len(pdf_document)  # type: ignore

            for page_num in range(total_pages):
                page = pdf_document[page_num]  # type: ignore

                # Try to extract text directly
                text: str = page.get_text()  # type: ignore

                # If no text found, it might be a scanned PDF
                if not text or not text.strip():  # type: ignore[union-attr]
                    # Convert page to image
                    pix = page.get_pixmap(dpi=300)  # type: ignore
                    img_data: bytes = pix.tobytes("png")  # type: ignore

                    # Convert to PIL Image
                    image = Image.open(io.BytesIO(img_data))  # type: ignore

                    # Perform OCR
                    text = pytesseract.image_to_string(image, lang='eng')  # type: ignore

                all_text.append({
                    "page": page_num + 1,
                    "text": text.strip() if text else ""  # type: ignore[union-attr]
                })

            pdf_document.close()  # type: ignore

            return {
                "pages": all_text,
                "total_pages": total_pages,
                "full_text": "\n\n".join([p["text"] for p in all_text]),
                "success": True
            }

        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            return {
                "error": str(e),
                "pages": [],
                "success": False
            }

    async def extract_text_from_base64(self, base64_string: str) -> dict[str, Any]:
        """Extract text from base64 encoded image"""
        try:
            # Decode base64 string
            image_data = base64.b64decode(base64_string)
            image = Image.open(io.BytesIO(image_data))  # type: ignore

            # Convert PIL Image to numpy array
            img_array = np.array(image)  # type: ignore[no-untyped-call]

            # If image has alpha channel, remove it
            if img_array.shape[-1] == 4:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)  # type: ignore[no-untyped-call]

            # Convert to grayscale
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)  # type: ignore[no-untyped-call]

            # Perform OCR
            text: str = pytesseract.image_to_string(gray, lang='eng')  # type: ignore

            return {
                "text": text.strip(),
                "success": True
            }

        except Exception as e:
            logger.error(f"Base64 OCR error: {e}")
            return {
                "error": str(e),
                "text": "",
                "success": False
            }

    async def analyze_document_layout(self, image_path: str) -> dict[str, Any]:
        """Analyze document layout and structure"""
        try:
            image = cv2.imread(image_path)
            # cv2.imread can return None, but Pylance doesn't know this
            if image is None:  # type: ignore[comparison-overlap]
                return {"error": "Could not load image"}

            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

            # Detect text regions
            data: dict[str, list[Any]] = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)  # type: ignore

            # Group text by blocks
            blocks: list[list[dict[str, Any]]] = []
            current_block: list[dict[str, Any]] = []

            for i in range(len(data['text'])):
                if data['conf'][i] and int(str(data['conf'][i])) > 0:
                    if data['text'][i] and str(data['text'][i]).strip():
                        current_block.append({
                            'text': data['text'][i],
                            'x': data['left'][i],
                            'y': data['top'][i],
                            'width': data['width'][i],
                            'height': data['height'][i],
                            'confidence': data['conf'][i]
                        })
                elif current_block:
                    blocks.append(current_block)
                    current_block = []

            if current_block:
                blocks.append(current_block)

            # Identify document sections
            sections = self._identify_sections(blocks)

            return {
                "blocks": blocks,
                "sections": sections,
                "total_blocks": len(blocks),
                "success": True
            }

        except Exception as e:
            logger.error(f"Layout analysis error: {e}")
            return {
                "error": str(e),
                "success": False
            }

    def _identify_sections(self, blocks: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
        """Identify document sections like headers, paragraphs, etc."""
        sections: list[dict[str, Any]] = []

        for block in blocks:
            if not block:
                continue

            # Calculate average font size (approximated by height)
            avg_height = sum(word['height'] for word in block) / len(block)

            # Determine section type based on characteristics
            text = ' '.join(word['text'] for word in block)

            section_type = "paragraph"  # default

            # Simple heuristics for section identification
            if avg_height > 20 and len(text) < 50:
                section_type = "heading"
            elif len(text) < 20 and text.isupper():
                section_type = "title"
            elif any(keyword in text.lower() for keyword in ['date:', 'ref:', 'case:']):
                section_type = "metadata"

            sections.append({
                "type": section_type,
                "text": text,
                "position": {
                    "x": block[0]['x'],
                    "y": block[0]['y']
                }
            })

        return sections


# Singleton instance
ocr_service = OCRService()
