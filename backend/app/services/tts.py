import os
from pathlib import Path

import httpx

from app.config import settings

TTS_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2audio/generation"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "audio"


class TTSService:
    def __init__(self):
        self.api_key = settings.dashscope_api_key
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    async def synthesize(self, text: str, voice: str = "longxiaochun", output_name: str = "") -> str:
        if not output_name:
            import uuid
            output_name = f"{uuid.uuid4().hex}.mp3"

        output_path = OUTPUT_DIR / output_name

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                TTS_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "cosyvoice-v1",
                    "input": {
                        "text": text,
                    },
                    "parameters": {
                        "voice": voice,
                        "format": "mp3",
                        "sample_rate": 22050,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()

            audio_url = data.get("output", {}).get("audio")
            if audio_url:
                audio_resp = await client.get(audio_url)
                audio_resp.raise_for_status()
                output_path.write_bytes(audio_resp.content)
                return str(output_path)

            return ""


tts_service = TTSService()
