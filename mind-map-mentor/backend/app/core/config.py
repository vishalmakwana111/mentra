from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str

    # JWT settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # File Storage Path
    FILE_STORAGE_PATH: str = "./storage"

    # Pinecone Settings
    PINECONE_API_KEY: str
    PINECONE_ENVIRONMENT: str
    PINECONE_INDEX_NAME: str

    # OpenAI Settings (Optional, e.g., for embeddings)
    OPENAI_API_KEY: Optional[str] = None

    # AI Feature Settings
    SIMILARITY_THRESHOLD: float = 0.5# Default threshold for auto-edges
    SIMILARITY_THRESHOLD_SUMMARY: float = 0.5 # Default threshold for summary-based edges
    SIMILARITY_THRESHOLD_CONTENT: float = 0.5 # Default threshold for content-based edges (if implemented)

    # Add other application settings here as needed
    # e.g., OPENAI_API_KEY: str | None = None

    # Pydantic settings configuration
    # Tells Pydantic to load variables from a .env file
    model_config = SettingsConfigDict(env_file=".env", extra='ignore')


# Create a single instance of the settings to be imported elsewhere
settings = Settings() 