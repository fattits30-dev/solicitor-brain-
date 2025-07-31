"""Voice API endpoints for dictation and text-to-speech"""
import os
import tempfile
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from backend.services.voice_service import VoiceService

router = APIRouter()
voice_service = VoiceService()


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
) -> dict[str, Any]:
    """Transcribe audio to text"""
    temp_path = ""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await audio.read()
            tmp.write(content)
            temp_path = tmp.name

        # Process audio
        audio_data = open(temp_path, 'rb').read()
        return await voice_service.transcribe_audio(audio_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@router.post("/transcribe-legal")
async def transcribe_legal_dictation(
    audio: UploadFile = File(...),
) -> dict[str, Any]:
    """Transcribe legal dictation with specialized formatting"""
    temp_path = ""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await audio.read()
            tmp.write(content)
            temp_path = tmp.name

        # Process with legal formatting
        audio_data = open(temp_path, 'rb').read()
        return await voice_service.transcribe_legal_dictation(audio_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


@router.post("/speak")
async def text_to_speech(
    text: str,
    voice: str = "default",
) -> StreamingResponse:
    """Convert text to speech"""
    try:
        audio_data = await voice_service.text_to_speech(text, voice_settings={"voice": voice})

        # Convert bytes to an iterator for StreamingResponse
        async def audio_generator():
            yield audio_data

        return StreamingResponse(
            audio_generator(),
            media_type="audio/wav",
            headers={"Content-Disposition": "attachment; filename=speech.wav"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/voices")
async def list_available_voices() -> dict[str, Any]:
    """Get list of available TTS voices"""
    try:
        voices: list[dict[str, Any]] = await voice_service.get_available_voices()
        return {
            "success": True,
            "voices": voices,
            "default": "default"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
