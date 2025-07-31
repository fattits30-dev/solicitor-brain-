"""Service to load and process real case files from the file system"""
import hashlib
import mimetypes
import os
from datetime import datetime
from typing import Any


class RealCaseLoaderService:
    def __init__(self):
        self.supported_extensions = [
            '.pdf', '.doc', '.docx', '.txt', '.rtf',
            '.odt', '.jpg', '.jpeg', '.png', '.tiff'
        ]
        self.case_data_cache: dict[str, Any] = {}

    async def scan_for_documents(self, base_path: str = "/media/mine/AI-DEV/solicitor-brain") -> list[dict[str, Any]]:
        """Scan filesystem for legal documents and case files"""
        documents: list[dict[str, Any]] = []

        # Common locations for legal documents
        search_paths = [
            os.path.join(base_path, "docs"),
            os.path.join(base_path, "cases"),
            os.path.join(base_path, "documents"),
            os.path.join(base_path, "legal"),
            os.path.join(base_path, "contracts"),
            os.path.expanduser("~/Documents"),
            os.path.expanduser("~/Desktop"),
        ]

        for search_path in search_paths:
            if os.path.exists(search_path):
                for root, dirs, files in os.walk(search_path):
                    # Skip hidden and system directories
                    dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', 'venv', '__pycache__']]

                    for file in files:
                        if any(file.endswith(ext) for ext in self.supported_extensions):
                            file_path = os.path.join(root, file)
                            doc_info = await self._process_document(file_path)
                            if doc_info:
                                documents.append(doc_info)

        return documents

    async def _process_document(self, file_path: str) -> dict[str, Any]:
        """Process a single document and extract metadata"""
        try:
            stat = os.stat(file_path)
            file_hash = self._get_file_hash(file_path)

            # Check if already processed
            if file_hash in self.case_data_cache:
                return self.case_data_cache[file_hash]

            doc_info = {
                "id": file_hash,
                "path": file_path,
                "name": os.path.basename(file_path),
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "type": mimetypes.guess_type(file_path)[0] or "unknown",
                "extension": os.path.splitext(file_path)[1].lower(),
                "category": self._categorize_document(file_path),
                "status": "ready"
            }

            # Cache the result
            self.case_data_cache[file_hash] = doc_info
            return doc_info

        except Exception:
            return {}

    def _get_file_hash(self, file_path: str) -> str:
        """Generate a hash for the file"""
        hasher = hashlib.md5()
        hasher.update(file_path.encode())
        with open(file_path, 'rb') as f:
            # Read first 1MB for hash
            chunk = f.read(1024 * 1024)
            if chunk:
                hasher.update(chunk)
        return hasher.hexdigest()

    def _categorize_document(self, file_path: str) -> str:
        """Categorize document based on name and path"""
        path_lower = file_path.lower()
        # name_lower = os.path.basename(file_path).lower()  # Unused variable

        if any(term in path_lower for term in ['contract', 'agreement', 'nda']):
            return "contract"
        if any(term in path_lower for term in ['case', 'matter', 'client']):
            return "case"
        if any(term in path_lower for term in ['letter', 'correspondence', 'email']):
            return "correspondence"
        if any(term in path_lower for term in ['court', 'filing', 'motion', 'brief']):
            return "court_filing"
        if any(term in path_lower for term in ['evidence', 'exhibit', 'proof']):
            return "evidence"
        if any(term in path_lower for term in ['note', 'memo', 'research']):
            return "note"
        return "general"

    async def create_case_from_documents(self, document_ids: list[str]) -> dict[str, Any]:
        """Create a case entry from selected documents"""
        documents = [doc for doc in self.case_data_cache.values() if doc['id'] in document_ids]

        if not documents:
            return {}

        # Generate case metadata
        case_id = hashlib.md5(''.join(document_ids).encode()).hexdigest()

        return {
            "id": case_id,
            "title": f"Case {datetime.now().strftime('%Y%m%d-%H%M')}",
            "created": datetime.now().isoformat(),
            "status": "active",
            "documents": documents,
            "document_count": len(documents),
            "categories": list({doc['category'] for doc in documents}),
            "total_size": sum(doc['size'] for doc in documents),
            "last_modified": max(doc['modified'] for doc in documents)
        }


    async def get_document_preview(self, document_id: str) -> dict[str, Any]:
        """Get a preview of document content"""
        doc = self.case_data_cache.get(document_id)
        if not doc:
            return {"error": "Document not found"}

        preview = {
            "id": document_id,
            "name": doc['name'],
            "type": doc['type'],
            "category": doc['category'],
            "preview_available": False,
            "content": None
        }

        # For text files, read first 500 chars
        if doc['extension'] in ['.txt', '.md']:
            try:
                with open(doc['path'], encoding='utf-8') as f:
                    preview['content'] = f.read(500)
                    preview['preview_available'] = True
            except Exception:
                pass

        return preview

    async def prepare_for_ai_analysis(self, document_ids: list[str]) -> list[dict[str, Any]]:
        """Prepare documents for AI analysis"""
        prepared: list[dict[str, Any]] = []

        for doc_id in document_ids:
            doc = self.case_data_cache.get(doc_id)
            if doc:
                prepared.append({
                    "id": doc_id,
                    "path": doc['path'],
                    "name": doc['name'],
                    "type": doc['type'],
                    "category": doc['category'],
                    "ready_for_ocr": doc['extension'] in ['.jpg', '.jpeg', '.png', '.tiff', '.pdf'],
                    "ready_for_text": doc['extension'] in ['.txt', '.doc', '.docx', '.rtf', '.odt']
                })

        return prepared
