"""
Electron IPC Bridge for Python Backend
Handles IPC messages from Electron and routes them to appropriate backend services
"""

import asyncio
import json
import logging
import sys
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

# Import backend services
from backend.services.ai_service import AIService
from backend.services.auth import AuthService
from backend.services.case_analyzer import CaseAnalyzer
from backend.services.document_scanner import DocumentScanner
from backend.services.evidence_scanner import EvidenceScanner
from backend.services.ocr_service import OCRService
from backend.services.templates_service import TemplatesService
from backend.services.voice_service import VoiceService

# Import database utilities
from backend.utils.app_mode import get_database_module

if TYPE_CHECKING:
    from backend.services.fact_service import FactService

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ElectronBridge:
    """Bridge between Electron IPC and Python backend services"""

    def __init__(self):
        self.db_module = get_database_module()
        # Initialize service attributes
        self.ai_service: AIService
        self.auth_service: AuthService
        self.fact_service: FactService
        self.templates_service: TemplatesService
        self.ocr_service: OCRService
        self.voice_service: VoiceService
        self.case_analyzer: CaseAnalyzer
        self.document_scanner: DocumentScanner
        self.evidence_scanner: EvidenceScanner
        self._init_services()

    def _init_services(self):
        """Initialize all available services"""
        try:
            self.ai_service = AIService()
            self.auth_service = AuthService()
            # FactService requires db session, will be initialized per request
            self.fact_service = None  # type: ignore
            self.templates_service = TemplatesService()
            self.ocr_service = OCRService()
            self.voice_service = VoiceService()
            self.case_analyzer = CaseAnalyzer()
            self.document_scanner = DocumentScanner()
            self.evidence_scanner = EvidenceScanner()

            logger.info("Initialized all services")
        except Exception as e:
            logger.error(f"Error initializing services: {e}")
            raise

    async def handle_message(self, message: dict[str, Any]) -> dict[str, Any]:
        """Handle incoming IPC message from Electron"""
        try:
            channel = message.get('channel', '')
            method = message.get('method', '')
            args = message.get('args', {})
            request_id = message.get('id', '')

            logger.info(f"[{request_id}] Handling IPC: {channel}:{method}")

            # Validate request
            if not channel or not method:
                return self._error_response('Missing channel or method', request_id)

            # Route to appropriate handler
            handlers = {
                'db': self.handle_db_operation,
                'ai': self.handle_ai_operation,
                'search': self.handle_search_operation,
                'auth': self.handle_auth_operation,
                'file': self.handle_file_operation,
                'job': self.handle_job_operation,
                'case': self.handle_case_operation,
                'document': self.handle_document_operation,
                'email': self.handle_email_operation,
                'voice': self.handle_voice_operation,
                'ocr': self.handle_ocr_operation,
            }

            handler = handlers.get(channel)
            if not handler:
                return self._error_response(f'Unknown channel: {channel}', request_id)

            result = await handler(method, args)
            result['id'] = request_id
            result['timestamp'] = datetime.now(UTC).isoformat()
            return result

        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)
            return self._error_response(str(e), message.get('id', ''))

    def _error_response(self, error: str, request_id: str = '') -> dict[str, Any]:
        """Create standardized error response"""
        return {
            'error': error,
            'success': False,
            'id': request_id,
            'timestamp': datetime.now(UTC).isoformat()
        }

    def _success_response(self, data: Any = None, request_id: str = '') -> dict[str, Any]:
        """Create standardized success response"""
        return {
            'data': data,
            'success': True,
            'id': request_id,
            'timestamp': datetime.now(UTC).isoformat()
        }

    async def handle_db_operation(self, method: str, _: dict[str, Any]) -> dict[str, Any]:
        """Handle direct database operations"""
        try:
            if method == 'health':
                # Check database health
                from backend.utils.database import check_db_connection
                is_healthy = await check_db_connection()
                return self._success_response({'status': 'healthy' if is_healthy else 'unhealthy'})
            return self._error_response(f'Unknown db method: {method}')

        except Exception as e:
            logger.error(f"Database operation error: {e}")
            return self._error_response(str(e))

    async def handle_ai_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle AI operations"""
        try:
            if method == 'chat':
                response = await self.ai_service.generate_response(
                    args['message'],
                    args.get('context')
                )
                return self._success_response({'response': response})

            if method == 'analyzeDocument':
                analysis = await self.ai_service.analyze_document(
                    args['content'],
                    args.get('document_type', 'general')
                )
                return self._success_response(analysis)

            if method == 'analyzeCase':
                # Case analyzer requires db session, use AI to analyze instead
                case_info = f"Analyze case {args['case_id']} with depth {args.get('depth', 'standard')}"
                response = await self.ai_service.generate_response(case_info)
                return self._success_response({'analysis': response})

            if method == 'extractFacts':
                # Use AI to analyze text for facts
                analysis = await self.ai_service.analyze_text(
                    f"Extract legal facts from the following text and return them in JSON format: {args['text']}"
                )
                return self._success_response(analysis)

            if method == 'generateDocument':
                # Templates service doesn't have this method, return error
                return self._error_response('Document generation not implemented')

            if method == 'summarize':
                summary = await self.ai_service.generate_response(
                    f"Please summarize the following text in {args.get('max_length', 500)} characters: {args['text']}"
                )
                return self._success_response({'summary': summary})

            return self._error_response(f'Unknown AI method: {method}')

        except Exception as e:
            logger.error(f"AI operation error: {e}")
            return self._error_response(str(e))

    async def handle_search_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle search operations"""
        try:
            # Use AI service for semantic search
            ai_service = self.ai_service

            if method == 'documents':
                results = await ai_service.search_legal_knowledge(
                    f"Search for documents about: {args['query']}"
                )
                return self._success_response({'results': results})

            if method == 'cases':
                results = await ai_service.search_legal_knowledge(
                    f"Search for legal cases about: {args['query']}"
                )
                return self._success_response({'results': results})

            if method == 'facts':
                # Use AI to search for facts
                results = await self.ai_service.search_legal_knowledge(
                    f"Search for legal facts about: {args['query']}"
                )
                return self._success_response({'results': results})

            if method == 'all':
                # Search across all content types
                search_result = await ai_service.search_legal_knowledge(args['query'])
                all_results = {
                    'documents': [search_result],
                    'cases': [search_result],
                    'facts': []
                }
                return self._success_response(all_results)

            return self._error_response(f'Unknown search method: {method}')

        except Exception as e:
            logger.error(f"Search operation error: {e}")
            return self._error_response(str(e))

    async def handle_auth_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle authentication operations"""
        try:
            auth_service = self.auth_service

            if method == 'login':
                # Auth is disabled, return default user
                from backend.services.auth import get_default_user
                user = get_default_user()
                token = auth_service.create_access_token({'sub': user['id']})
                return self._success_response({'user': user, 'token': token})

            if method == 'logout':
                # Auth is disabled, just return success
                return self._success_response({'logged_out': True})

            if method == 'verify':
                user = auth_service.decode_token(args['token'])
                return self._success_response(user)

            if method == 'changePassword':
                # Auth is disabled, just return success
                return self._success_response({'changed': True})

            if method == 'refreshToken':
                # Auth is disabled, return same token
                return self._success_response({'token': args['token']})

            return self._error_response(f'Unknown auth method: {method}')

        except Exception as e:
            logger.error(f"Auth operation error: {e}")
            return self._error_response(str(e))

    async def handle_file_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle file operations"""
        try:
            if method == 'scan':
                # Scan document using document scanner
                # Use document scanner
                result = await self.document_scanner.analyze_document(
                    args['file_path']
                )
                return self._success_response(result)

            if method == 'scanEvidence':
                # Evidence scanner doesn't have scan_file method, use document scanner
                # Use document scanner
                result = await self.document_scanner.analyze_document(
                    args['file_path']
                )
                return self._success_response(result)

            if method == 'ocr':
                # OCR processing
                # OCR processing
                ocr_result = await self.ocr_service.extract_text_from_image(
                    args['image_path']
                )
                return self._success_response(ocr_result)

            if method == 'upload':
                # Handle file upload
                file_info = {
                    'path': args['path'],
                    'size': args.get('size', 0),
                    'type': args.get('type', 'unknown'),
                    'uploaded_at': datetime.now(UTC).isoformat()
                }
                return self._success_response(file_info)

            return self._error_response(f'Unknown file method: {method}')

        except Exception as e:
            logger.error(f"File operation error: {e}")
            return self._error_response(str(e))

    async def handle_case_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle case-specific operations"""
        try:
            # Case analyzer methods require db session, use AI instead
            ai_service = self.ai_service

            if method == 'analyze':
                prompt = f"Analyze case {args['case_id']} with depth {args.get('depth', 'standard')}"
                analysis = await ai_service.generate_response(prompt)
                return self._success_response({'analysis': analysis})

            if method == 'timeline':
                prompt = f"Generate a timeline for case {args['case_id']}"
                timeline = await ai_service.generate_response(prompt)
                return self._success_response({'timeline': timeline})

            if method == 'recommendations':
                prompt = f"Provide recommendations for case {args['case_id']}"
                recommendations = await ai_service.generate_response(prompt)
                return self._success_response({'recommendations': recommendations})

            if method == 'riskAssessment':
                prompt = f"Assess risks for case {args['case_id']}"
                risks = await ai_service.generate_response(prompt)
                return self._success_response({'risks': risks})

            return self._error_response(f'Unknown case method: {method}')

        except Exception as e:
            logger.error(f"Case operation error: {e}")
            return self._error_response(str(e))

    async def handle_document_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle document-specific operations"""
        try:
            if method == 'scan':
                result = await self.document_scanner.analyze_document(
                    args['file_path']
                )
                return self._success_response(result)

            if method == 'extract':
                # Use AI to extract structured data
                prompt = f"Extract structured data from document {args['document_id']} with schema {args.get('schema')}"
                data = await self.ai_service.generate_response(prompt)
                return self._success_response({'data': data})

            if method == 'classify':
                # Use AI to classify document
                classification = await self.ai_service.analyze_document(
                    args['content'],
                    'general'
                )
                return self._success_response(classification)

            return self._error_response(f'Unknown document method: {method}')

        except Exception as e:
            logger.error(f"Document operation error: {e}")
            return self._error_response(str(e))

    async def handle_email_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle email operations"""
        try:
            # Use AI service for email processing
            ai_service = self.ai_service

            if method == 'parse':
                # Parse email content using AI
                prompt = f"Parse the following email and extract key information:\n{args['content']}"
                parsed = await ai_service.generate_response(prompt)
                return self._success_response({'parsed': parsed})

            if method == 'categorize':
                # Categorize email using AI
                prompt = f"Categorize the following email content:\n{args['content']}"
                category = await ai_service.generate_response(prompt)
                return self._success_response({'category': category})

            if method == 'extractActions':
                # Extract action items from email using AI
                prompt = f"Extract action items from the following email:\n{args['content']}"
                actions = await ai_service.generate_response(prompt)
                return self._success_response({'actions': actions})

            return self._error_response(f'Unknown email method: {method}')

        except Exception as e:
            logger.error(f"Email operation error: {e}")
            return self._error_response(str(e))

    async def handle_voice_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle voice operations"""
        try:
            voice_service = self.voice_service

            if method == 'transcribe':
                # Read audio file and transcribe
                with open(args['audio_path'], 'rb') as f:
                    audio_data = f.read()
                result = await voice_service.transcribe_audio(
                    audio_data,
                    args.get('format', 'wav')
                )
                return self._success_response(result)

            if method == 'synthesize':
                audio_data = await voice_service.text_to_speech(
                    args['text'],
                    args.get('voice_settings')
                )
                # Save audio data to file
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
                    f.write(audio_data)
                    audio_path = f.name
                return self._success_response({'audio_path': audio_path})

            return self._error_response(f'Unknown voice method: {method}')

        except Exception as e:
            logger.error(f"Voice operation error: {e}")
            return self._error_response(str(e))

    async def handle_ocr_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle OCR operations"""
        try:
            ocr_service = self.ocr_service

            if method == 'process':
                result = await ocr_service.extract_text_from_image(
                    args['image_path']
                )
                return self._success_response(result)

            if method == 'processPdf':
                result = await ocr_service.extract_text_from_pdf(
                    args['pdf_path']
                )
                return self._success_response(result)

            return self._error_response(f'Unknown OCR method: {method}')

        except Exception as e:
            logger.error(f"OCR operation error: {e}")
            return self._error_response(str(e))

    async def handle_job_operation(self, method: str, args: dict[str, Any]) -> dict[str, Any]:
        """Handle background job operations"""
        try:
            if method == 'processBackgroundJob':
                job_type = args['type']
                job_data = args['data']

                # Process different job types
                job_handlers = {
                    'document_processing': self._process_document_job,
                    'case_analysis': self._process_case_analysis_job,
                    'bulk_ocr': self._process_bulk_ocr_job,
                    'evidence_scan': self._process_evidence_scan_job,
                }

                handler = job_handlers.get(job_type)
                if not handler:
                    return self._error_response(f'Unknown job type: {job_type}')

                result = await handler(job_data)
                return self._success_response(result)

            return self._error_response(f'Unknown job method: {method}')

        except Exception as e:
            logger.error(f"Job operation error: {e}")
            return self._error_response(str(e))

    async def _process_document_job(self, job_data: dict[str, Any]) -> dict[str, Any]:
        """Process document background job"""
        document_path: str = job_data['document_path']
        operations = job_data.get('operations', ['scan', 'ocr', 'analyze'])
        results: dict[str, Any] = {}

        if 'scan' in operations:
            scanner = self.document_scanner
            results['scan'] = await scanner.analyze_document(document_path)

        if 'ocr' in operations:
            ocr_result = await self.ocr_service.extract_text_from_image(document_path)
            results['ocr'] = ocr_result

        if 'analyze' in operations:
            # Extract text content with explicit type handling
            text_content = ''

            # Try OCR results first
            if 'ocr' in results:
                ocr_result = results['ocr']
                if isinstance(ocr_result, dict) and 'text' in ocr_result:
                    # Type narrowing: after checking key exists, access is safe
                    ocr_value = ocr_result['text']  # type: ignore[assignment]
                    if isinstance(ocr_value, str):
                        text_content = ocr_value

            # Fall back to scan results if no OCR text
            if not text_content and 'scan' in results:
                scan_result = results['scan']
                if isinstance(scan_result, dict) and 'text_content' in scan_result:
                    # Type narrowing: after checking key exists, access is safe
                    scan_value = scan_result['text_content']  # type: ignore[assignment]
                    if isinstance(scan_value, str):
                        text_content = scan_value
            analysis = await self.ai_service.analyze_document(
                text_content,
                job_data.get('document_type', 'general')
            )
            results['analysis'] = analysis

        return results

    async def _process_case_analysis_job(self, job_data: dict[str, Any]) -> dict[str, Any]:
        """Process case analysis job"""
        case_id = job_data['case_id']

        # Use AI to generate comprehensive case analysis
        analysis_prompt = f"Provide comprehensive analysis for case {case_id}"
        timeline_prompt = f"Generate timeline for case {case_id}"
        risks_prompt = f"Assess risks for case {case_id}"
        recommendations_prompt = f"Provide recommendations for case {case_id}"

        analysis = await self.ai_service.generate_response(analysis_prompt)
        timeline = await self.ai_service.generate_response(timeline_prompt)
        risks = await self.ai_service.generate_response(risks_prompt)
        recommendations = await self.ai_service.generate_response(recommendations_prompt)

        return {
            'analysis': analysis,
            'timeline': timeline,
            'risks': risks,
            'recommendations': recommendations
        }

    async def _process_bulk_ocr_job(self, job_data: dict[str, Any]) -> dict[str, Any]:
        """Process bulk OCR job"""
        file_paths = job_data['file_paths']
        results: list[dict[str, Any]] = []

        for path in file_paths:
            try:
                # Determine if PDF or image
                if path.lower().endswith('.pdf'):
                    ocr_result = await self.ocr_service.extract_text_from_pdf(path)
                else:
                    ocr_result = await self.ocr_service.extract_text_from_image(path)

                results.append({
                    'path': path,
                    'success': True,
                    'result': ocr_result
                })
            except Exception as e:
                results.append({
                    'path': path,
                    'success': False,
                    'error': str(e)
                })

        return {'results': results}

    async def _process_evidence_scan_job(self, job_data: dict[str, Any]) -> dict[str, Any]:
        """Process evidence scan job"""
        file_paths = job_data['file_paths']
        case_id = job_data.get('case_id')

        all_evidence: list[dict[str, Any]] = []
        for path in file_paths:
            # Use document scanner to analyze files
            doc_analysis = await self.document_scanner.analyze_document(path)
            # Add case context
            doc_analysis['case_id'] = case_id
            all_evidence.append(doc_analysis)

        return {'evidence': all_evidence}


async def main():
    """Main entry point for Electron bridge"""
    bridge = ElectronBridge()

    # Initialize database
    db_module = get_database_module()
    await db_module.init_db()

    logger.info("Electron bridge started successfully")
    logger.info("Electron bridge services initialized")

    # Read messages from stdin
    while True:
        try:
            line = sys.stdin.readline()
            if not line:
                break

            # Parse JSON message
            message = json.loads(line.strip())

            # Handle message asynchronously
            await bridge.handle_message(message)

            # Send response to stdout
            sys.stdout.flush()

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON: {e}")
            sys.stdout.flush()

        except KeyboardInterrupt:
            logger.info("Electron bridge shutting down...")
            break

        except Exception as e:
            logger.error(f"Main loop error: {e}", exc_info=True)
            {
                'error': str(e),
                'success': False
            }
            sys.stdout.flush()


if __name__ == '__main__':
    asyncio.run(main())
