import hashlib
import logging
import mimetypes
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import magic
from PIL import Image

from backend.services.ocr_service import ocr_service

logger = logging.getLogger(__name__)


class DocumentScanner:
    """Advanced document scanning and categorization service"""

    # Document categories based on legal practice
    DOCUMENT_CATEGORIES = {
        "contracts": {
            "keywords": ["agreement", "contract", "terms", "conditions", "party", "parties", "executed", "witnesseth"],
            "patterns": [r"AGREEMENT\s+BETWEEN", r"CONTRACT\s+FOR", r"TERMS\s+AND\s+CONDITIONS"],
            "extensions": [".pdf", ".doc", ".docx"],
        },
        "court_documents": {
            "keywords": ["court", "judge", "plaintiff", "defendant", "order", "judgment", "petition", "motion"],
            "patterns": [r"IN\s+THE\s+.*\s+COURT", r"CASE\s+NO\.", r"CIVIL\s+ACTION"],
            "extensions": [".pdf", ".doc", ".docx"],
        },
        "correspondence": {
            "keywords": ["dear", "sincerely", "regards", "subject", "re:", "email", "letter"],
            "patterns": [r"Dear\s+\w+", r"RE:\s+", r"Subject:\s+"],
            "extensions": [".pdf", ".doc", ".docx", ".msg", ".eml", ".txt"],
        },
        "evidence": {
            "keywords": ["exhibit", "evidence", "photograph", "image", "screenshot", "recording"],
            "patterns": [r"EXHIBIT\s+[A-Z0-9]+", r"Evidence\s+#"],
            "extensions": [".jpg", ".jpeg", ".png", ".pdf", ".mp3", ".mp4", ".wav"],
        },
        "financial": {
            "keywords": ["invoice", "receipt", "payment", "amount", "balance", "transaction", "account"],
            "patterns": [r"INVOICE\s+#", r"Total:\s*[\$£€]", r"Balance\s+Due"],
            "extensions": [".pdf", ".xlsx", ".xls", ".csv"],
        },
        "witness_statements": {
            "keywords": ["witness", "statement", "declare", "swear", "affirm", "testimony"],
            "patterns": [r"WITNESS\s+STATEMENT", r"I,?\s+\w+.*\s+declare"],
            "extensions": [".pdf", ".doc", ".docx"],
        },
        "wills_estates": {
            "keywords": ["will", "testament", "estate", "beneficiary", "executor", "bequest"],
            "patterns": [r"LAST\s+WILL\s+AND\s+TESTAMENT", r"Estate\s+of"],
            "extensions": [".pdf", ".doc", ".docx"],
        },
        "property": {
            "keywords": ["deed", "title", "property", "land", "mortgage", "lease", "tenant", "landlord"],
            "patterns": [r"DEED\s+OF", r"PROPERTY\s+DESCRIPTION", r"LEASE\s+AGREEMENT"],
            "extensions": [".pdf", ".doc", ".docx"],
        }
    }

    # File type handlers
    SUPPORTED_FORMATS = {
        "documents": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"],
        "images": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp"],
        "spreadsheets": [".xlsx", ".xls", ".csv", ".ods"],
        "emails": [".msg", ".eml", ".mbox"],
        "archives": [".zip", ".rar", ".7z", ".tar", ".gz"],
        "media": [".mp3", ".mp4", ".wav", ".avi", ".mov"],
    }

    def __init__(self, base_path: str = "uploads"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
        self.scan_cache: dict[str, dict[str, Any]] = {}

    async def scan_directory(self, directory: str | None = None) -> dict[str, Any]:
        """Recursively scan directory for all documents"""
        scan_path = Path(directory) if directory else self.base_path

        if not scan_path.exists():
            return {"error": f"Path {scan_path} does not exist"}

        documents: list[dict[str, Any]] = []
        total_size = 0
        file_types: dict[str, int] = {}

        for file_path in scan_path.rglob("*"):
            if file_path.is_file():
                try:
                    doc_info = await self.analyze_document(str(file_path))
                    documents.append(doc_info)
                    total_size += doc_info["size"]

                    # Count file types
                    ext = doc_info["extension"]
                    file_types[ext] = file_types.get(ext, 0) + 1

                except Exception as e:
                    logger.error(f"Error analyzing {file_path}: {e}")

        return {
            "total_documents": len(documents),
            "total_size": total_size,
            "file_types": file_types,
            "documents": documents,
            "scan_date": datetime.now(UTC).isoformat(),
        }

    async def analyze_document(self, file_path: str) -> dict[str, Any]:
        """Comprehensive document analysis"""
        path = Path(file_path)

        # Check cache
        file_hash = self._calculate_file_hash(file_path)
        if file_hash in self.scan_cache:
            return self.scan_cache[file_hash]

        # Basic file info
        stat = path.stat()
        doc_info = {
            "path": str(path),
            "name": path.name,
            "extension": path.suffix.lower(),
            "size": stat.st_size,
            "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "hash": file_hash,
        }

        # Detect MIME type
        try:
            mime = magic.from_file(str(file_path), mime=True)  # type: ignore[attr-defined]
            doc_info["mime_type"] = mime
        except Exception:
            mime_type = mimetypes.guess_type(file_path)[0]
            doc_info["mime_type"] = mime_type if mime_type else ""

        # Extract content and metadata
        content_data = await self._extract_content(file_path)
        doc_info.update(content_data)

        # Categorize document
        category = await self._categorize_document(doc_info)
        doc_info["category"] = category

        # Extract entities and metadata
        if doc_info.get("text_content"):
            text_content = doc_info["text_content"]
            if isinstance(text_content, str):
                entities = self._extract_entities(text_content)
                doc_info["entities"] = entities  # type: ignore[assignment]

        # Cache result
        self.scan_cache[file_hash] = doc_info

        return doc_info

    async def _extract_content(self, file_path: str) -> dict[str, Any]:
        """Extract content from various file types"""
        path = Path(file_path)
        extension = path.suffix.lower()
        content_data: dict[str, Any] = {}

        try:
            if extension == ".pdf":
                # Extract from PDF
                result = await ocr_service.extract_text_from_pdf(file_path)
                content_data["text_content"] = result.get("full_text", "")
                content_data["page_count"] = result.get("total_pages", 0)
                content_data["extraction_method"] = "pdf"

            elif extension in self.SUPPORTED_FORMATS["images"]:
                # Extract from image
                result = await ocr_service.extract_text_from_image(file_path)
                content_data["text_content"] = result.get("text", "")
                content_data["ocr_confidence"] = result.get("confidence", 0)
                content_data["extraction_method"] = "ocr"

                # Get image metadata
                with Image.open(file_path) as img:  # type: ignore[attr-defined]
                    content_data["dimensions"] = f"{img.width}x{img.height}"  # type: ignore[attr-defined]
                    content_data["format"] = str(img.format) if img.format else ""  # type: ignore[arg-type]

            elif extension in [".txt", ".log", ".md"]:
                # Read text files
                with open(file_path, encoding='utf-8', errors='ignore') as f:
                    content_data["text_content"] = f.read()
                content_data["extraction_method"] = "text"

            elif extension in [".doc", ".docx"]:
                # TODO: Implement Word document extraction
                content_data["text_content"] = ""
                content_data["extraction_method"] = "pending"

            else:
                content_data["text_content"] = ""
                content_data["extraction_method"] = "unsupported"

        except Exception as e:
            logger.error(f"Content extraction error for {file_path}: {e}")
            content_data["extraction_error"] = str(e)
            content_data["text_content"] = ""

        # Calculate content metrics
        if content_data.get("text_content"):
            text = content_data["text_content"]
            content_data["word_count"] = len(text.split())
            content_data["line_count"] = len(text.splitlines())
            content_data["char_count"] = len(text)

        return content_data

    async def _categorize_document(self, doc_info: dict[str, Any]) -> str:
        """Intelligently categorize document based on content and metadata"""
        text_content = doc_info.get("text_content", "").lower()
        file_name = doc_info.get("name", "").lower()
        extension = doc_info.get("extension", "")

        scores: dict[str, int] = {}

        for category, rules in self.DOCUMENT_CATEGORIES.items():
            score = 0

            # Check keywords in content
            for keyword in rules["keywords"]:
                if keyword in text_content:
                    score += text_content.count(keyword) * 2
                if keyword in file_name:
                    score += 5

            # Check patterns
            for pattern in rules["patterns"]:
                matches = re.findall(pattern, text_content, re.IGNORECASE)
                score += len(matches) * 3

            # Check extension preference
            if extension in rules["extensions"]:
                score += 1

            scores[category] = score

        # Return category with highest score, or "general" if no matches
        if scores and max(scores.values()) > 0:
            return max(scores, key=scores.get)  # type: ignore

        # Fallback categorization based on file type
        if extension in self.SUPPORTED_FORMATS["images"]:
            return "evidence"
        if extension in self.SUPPORTED_FORMATS["emails"]:
            return "correspondence"

        return "general"

    def _extract_entities(self, text: str) -> dict[str, list[str]]:
        """Extract legal entities from text"""
        entities: dict[str, list[str]] = {
            "case_numbers": [],
            "dates": [],
            "monetary_amounts": [],
            "names": [],
            "addresses": [],
            "email_addresses": [],
            "phone_numbers": [],
        }

        # Case numbers (various formats)
        case_patterns = [
            r"\b\d{4}[-/]\d{2,6}\b",  # 2024-12345
            r"\bCase\s+No\.?\s*:?\s*[\w-]+\b",
            r"\b[A-Z]{2,}\s+\d{2,6}[-/]\d{2,4}\b",  # CV 2024-123
        ]
        for pattern in case_patterns:
            entities["case_numbers"].extend(re.findall(pattern, text, re.IGNORECASE))

        # Dates
        date_patterns = [
            r"\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b",
            r"\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b",
            r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b",
        ]
        for pattern in date_patterns:
            entities["dates"].extend(re.findall(pattern, text, re.IGNORECASE))

        # Monetary amounts
        money_patterns = [
            r"[\$£€]\s*\d+(?:,\d{3})*(?:\.\d{2})?",
            r"\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|pounds|euros|GBP|USD|EUR)\b",
        ]
        for pattern in money_patterns:
            entities["monetary_amounts"].extend(re.findall(pattern, text, re.IGNORECASE))

        # Email addresses
        entities["email_addresses"] = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", text)

        # Phone numbers
        phone_pattern = r"\b(?:\+?44\s?|0)(?:\d{4}\s?\d{6}|\d{3}\s?\d{3}\s?\d{4}|\d{2}\s?\d{4}\s?\d{4})\b"
        entities["phone_numbers"] = re.findall(phone_pattern, text)

        # Clean up duplicates
        for key in entities:
            entities[key] = list(set(entities[key]))

        return entities

    def _calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    async def find_duplicates(self, directory: str | None = None) -> dict[str, list[str]]:
        """Find duplicate files based on content hash"""
        scan_path = Path(directory) if directory else self.base_path
        hash_map: dict[str, list[str]] = {}

        for file_path in scan_path.rglob("*"):
            if file_path.is_file():
                try:
                    file_hash = self._calculate_file_hash(str(file_path))
                    if file_hash not in hash_map:
                        hash_map[file_hash] = []
                    hash_map[file_hash].append(str(file_path))
                except Exception as e:
                    logger.error(f"Error hashing {file_path}: {e}")

        # Return only duplicates
        return {k: v for k, v in hash_map.items() if len(v) > 1}

    async def organize_documents(self, source_dir: str, target_dir: str) -> dict[str, Any]:
        """Organize documents into categorized folder structure"""
        source_path = Path(source_dir)
        target_path = Path(target_dir)

        if not source_path.exists():
            return {"error": f"Source directory {source_dir} does not exist"}

        # Create target directory structure
        for category in self.DOCUMENT_CATEGORIES:
            (target_path / category).mkdir(parents=True, exist_ok=True)
        (target_path / "general").mkdir(exist_ok=True)

        moved_files: list[dict[str, str]] = []
        errors: list[dict[str, str]] = []

        # Scan and organize files
        documents = await self.scan_directory(source_dir)

        for doc in documents.get("documents", []):
            try:
                source_file = Path(doc["path"])
                category = doc["category"]

                # Create case-specific subdirectory if case number found
                case_numbers = doc.get("entities", {}).get("case_numbers", [])
                if case_numbers:
                    target_category_dir = target_path / category / case_numbers[0]
                else:
                    target_category_dir = target_path / category

                target_category_dir.mkdir(parents=True, exist_ok=True)

                # Move file
                target_file = target_category_dir / source_file.name

                # Handle duplicates by appending number
                if target_file.exists():
                    i = 1
                    while target_file.exists():
                        stem = source_file.stem
                        suffix = source_file.suffix
                        target_file = target_category_dir / f"{stem}_{i}{suffix}"
                        i += 1

                source_file.rename(target_file)
                moved_files.append({
                    "source": str(source_file),
                    "target": str(target_file),
                    "category": category
                })

            except Exception as e:
                errors.append({
                    "file": doc["path"],
                    "error": str(e)
                })

        return {
            "total_organized": len(moved_files),
            "moved_files": moved_files,
            "errors": errors,
            "organization_date": datetime.now(UTC).isoformat()
        }


# Singleton instance
document_scanner = DocumentScanner()
