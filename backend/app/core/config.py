"""
Configuration settings for SENTINEL AI backend.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

_BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
_MODELS_DIR = _BASE_DIR / "models"
_DATA_DIR = _BASE_DIR / "data"


class Settings(BaseSettings):
    PROJECT_NAME: str = "SENTINEL AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    BASE_DIR: str = str(_BASE_DIR)
    DATA_DIR: str = str(_DATA_DIR)
    MODELS_DIR: str = str(_MODELS_DIR)
    MODEL_PATH: str = str(_MODELS_DIR / "sentinel_model.joblib")
    METRICS_PATH: str = str(_MODELS_DIR / "evaluation_report.json")
    METADATA_PATH: str = str(_MODELS_DIR / "model_metadata.json")
    ARCHIVE_PATH: str = str(_DATA_DIR / "archive.json")
    
    # Security limits
    MAX_MESSAGE_LENGTH: int = 25000  # max characters per analysis
    MIN_MESSAGE_LENGTH: int = 1
    
    # CORS origins
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]


settings = Settings()
