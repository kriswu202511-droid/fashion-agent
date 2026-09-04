import uuid
from pathlib import Path
from typing import Any

import httpx

from app.config import settings
from app.services.tts import tts_service

OUTPUT_DIR = Path(__file__).parent.parent.parent / "data" / "video"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class VideoService:
    """Video generation service with two configurable modes.

    - API mode: calls third-party video generation APIs (e.g. Tongyi Wanxiang / Kling)
    - Pipeline mode: local TTS + image gen + FFmpeg compose (MiniMax H3 ready)
    """

    def __init__(self):
        self.mode = settings.video_mode

    async def generate(
        self,
        script: str,
        narration: str = "",
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if self.mode == "api":
            return await self.generate_with_api(script, options)
        return await self.generate_with_pipeline(script, narration, options)

    async def generate_with_api(self, script: str, options: dict[str, Any] | None = None) -> dict[str, Any]:
        options = options or {}
        task_id = uuid.uuid4().hex

        if not settings.video_api_key or not settings.video_api_url:
            return {
                "task_id": task_id,
                "status": "config_missing",
                "message": "视频 API 未配置，请在 .env 中设置 VIDEO_API_KEY 和 VIDEO_API_URL",
                "script": script,
            }

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                response = await client.post(
                    settings.video_api_url,
                    headers={
                        "Authorization": f"Bearer {settings.video_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": options.get("model", "video-gen"),
                        "input": {
                            "script": script,
                            "duration": options.get("duration", "30s"),
                            "style": options.get("style", "default"),
                        },
                        "parameters": {
                            "resolution": options.get("resolution", "1080p"),
                            "format": "mp4",
                        },
                    },
                )
                response.raise_for_status()
                data = response.json()

            video_url = data.get("output", {}).get("video_url", "")
            return {
                "task_id": task_id,
                "status": "completed" if video_url else "pending",
                "video_url": video_url,
                "script": script,
                "message": "视频生成完成" if video_url else "视频生成已提交，请稍后查询结果",
            }
        except httpx.HTTPStatusError as e:
            return {
                "task_id": task_id,
                "status": "failed",
                "message": f"视频 API 调用失败: {e.response.status_code}",
                "script": script,
            }
        except Exception as e:
            return {
                "task_id": task_id,
                "status": "failed",
                "message": f"视频生成异常: {str(e)}",
                "script": script,
            }

    async def generate_with_pipeline(
        self,
        script: str,
        narration: str = "",
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        options = options or {}
        task_id = uuid.uuid4().hex

        audio_path = ""
        if narration:
            try:
                audio_path = await tts_service.synthesize(
                    text=narration,
                    output_name=f"{task_id}.mp3",
                )
            except Exception:
                audio_path = ""

        return {
            "task_id": task_id,
            "status": "completed" if audio_path else "partial",
            "audio_path": audio_path,
            "script": script,
            "message": "TTS 语音合成完成，视频合成管线待部署 MiniMax H3 后启用" if audio_path else "视频生成暂不可用",
        }


video_service = VideoService()
