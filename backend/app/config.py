from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    database_url: str = "sqlite+aiosqlite:///./fashion_agent.db"
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str = "change-me-to-a-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24

    dashscope_api_key: str = ""

    video_mode: str = "pipeline"
    video_api_key: str = ""
    video_api_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
