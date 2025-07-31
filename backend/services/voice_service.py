import asyncio

# import soundfile as sf  # Unused import
import io
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import pyttsx3  # type: ignore[import-untyped]
import speech_recognition as sr  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)


class VoiceService:
    """Service for voice dictation and text-to-speech capabilities"""

    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.engine = pyttsx3.init()  # type: ignore[no-untyped-call]
        self.executor = ThreadPoolExecutor(max_workers=2)

        # Configure TTS engine
        self.engine.setProperty('rate', 150)  # type: ignore[no-untyped-call]  # Speed of speech
        self.engine.setProperty('volume', 0.9)  # type: ignore[no-untyped-call]  # Volume level (0.0 to 1.0)

        # Get available voices
        voices = self.engine.getProperty('voices')  # type: ignore[no-untyped-call]
        if voices:
            # Try to use a British English voice if available
            for voice in voices:  # type: ignore[union-attr]
                if 'english' in voice.name.lower() and 'uk' in voice.name.lower():  # type: ignore[union-attr]
                    self.engine.setProperty('voice', voice.id)  # type: ignore[no-untyped-call,union-attr]
                    break

    async def transcribe_audio(self, audio_data: bytes, _audio_format: str = "wav") -> dict[str, Any]:  # Format for future use
        """Transcribe audio to text"""
        try:
            # Convert audio data to AudioFile format
            audio_file = sr.AudioFile(io.BytesIO(audio_data))  # type: ignore[no-untyped-call]

            with audio_file as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=1)  # type: ignore[no-untyped-call]
                audio = self.recognizer.record(source)  # type: ignore[no-untyped-call]

            # Try multiple recognition engines for better accuracy
            results: dict[str, str | None] = {}

            # Google Speech Recognition (free, no API key required)
            try:
                text_google: str = await asyncio.get_event_loop().run_in_executor(
                    self.executor,
                    lambda: self.recognizer.recognize_google(audio, "en-GB")  # type: ignore[attr-defined,no-any-return]
                )
                results['google'] = text_google
            except Exception as e:
                logger.warning(f"Google Speech Recognition failed: {e}")
                results['google'] = None

            # Combine results
            final_text = results.get('google', '')

            if not final_text:
                return {
                    "success": False,
                    "error": "Could not recognize speech",
                    "text": ""
                }

            # Perform basic punctuation and formatting
            formatted_text: str = self._format_legal_text(final_text)

            return {
                "success": True,
                "text": formatted_text,
                "raw_text": final_text,
                "confidence": 0.8,  # Approximate confidence
                "language": "en-GB"
            }

        except Exception as e:
            logger.error(f"Voice transcription error: {e}")
            return {
                "success": False,
                "error": str(e),
                "text": ""
            }

    def _format_legal_text(self, text: str) -> str:
        """Format transcribed text for legal documents"""
        # Capitalize first letter of sentences
        sentences = text.split('. ')
        formatted_sentences = [s.strip().capitalize() for s in sentences if s]
        text = '. '.join(formatted_sentences)

        # Add period at the end if missing
        if text and not text.endswith('.'):
            text += '.'

        # Common legal term corrections
        legal_terms = {
            'claimant': 'Claimant',
            'defendant': 'Defendant',
            'respondent': 'Respondent',
            'applicant': 'Applicant',
            'court': 'Court',
            'judge': 'Judge',
            'solicitor': 'Solicitor',
            'barrister': 'Barrister',
            'act': 'Act',
            'section': 'Section',
            'paragraph': 'Paragraph',
            'schedule': 'Schedule',
        }

        for term, replacement in legal_terms.items():
            text = text.replace(f' {term} ', f' {replacement} ')
            text = text.replace(f' {term}.', f' {replacement}.')
            text = text.replace(f' {term},', f' {replacement},')

        return text

    async def text_to_speech(self, text: str, voice_settings: dict[str, Any] | None = None) -> bytes:
        """Convert text to speech audio"""
        try:
            # Apply voice settings if provided
            if voice_settings:
                if 'rate' in voice_settings:
                    self.engine.setProperty('rate', voice_settings['rate'])  # type: ignore[no-untyped-call]
                if 'volume' in voice_settings:
                    self.engine.setProperty('volume', voice_settings['volume'])  # type: ignore[no-untyped-call]
                if 'voice_id' in voice_settings:
                    self.engine.setProperty('voice', voice_settings['voice_id'])  # type: ignore[no-untyped-call]

            # Save to temporary file (pyttsx3 limitation)
            import tempfile
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                tmp_path = tmp_file.name

            # Generate speech
            await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self._save_to_file,
                text,
                tmp_path
            )

            # Read the audio file
            with open(tmp_path, 'rb') as f:
                audio_data = f.read()

            # Clean up
            import os
            os.unlink(tmp_path)

            return audio_data

        except Exception as e:
            logger.error(f"Text-to-speech error: {e}")
            raise

    def _save_to_file(self, text: str, filename: str) -> None:
        """Helper method to save TTS to file"""
        self.engine.save_to_file(text, filename)  # type: ignore[no-untyped-call]
        self.engine.runAndWait()  # type: ignore[no-untyped-call]

    async def get_available_voices(self) -> list[dict[str, Any]]:
        """Get list of available TTS voices"""
        voices = self.engine.getProperty('voices')  # type: ignore[no-untyped-call]
        return [
            {
                "id": voice.id,  # type: ignore[union-attr]
                "name": voice.name,  # type: ignore[union-attr]
                "languages": voice.languages,  # type: ignore[union-attr]
                "gender": voice.gender  # type: ignore[union-attr]
            }
            for voice in voices  # type: ignore[union-attr]
        ]

    async def transcribe_legal_dictation(self, audio_data: bytes) -> dict[str, Any]:
        """Specialized transcription for legal dictation with formatting"""
        result = await self.transcribe_audio(audio_data)

        if result["success"]:
            # Apply legal-specific formatting
            text = result["text"]

            # Detect and format legal citations
            import re

            # Format case citations (e.g., "Smith v Jones 2023")
            text = re.sub(
                r'(\w+) versus (\w+) (\d{4})',
                r'\1 v \2 [\3]',
                text,
                flags=re.IGNORECASE
            )

            # Format section references
            text = re.sub(
                r'section (\d+)',
                r'Section \1',
                text,
                flags=re.IGNORECASE
            )

            # Format act references
            text = re.sub(
                r'(\w+) act (\d{4})',
                lambda m: f'{m.group(1).title()} Act {m.group(2)}',
                text,
                flags=re.IGNORECASE
            )

            result["formatted_text"] = text

        return result


# Singleton instance
voice_service = VoiceService()
