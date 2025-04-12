from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str

    # JWT settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    # Add other application settings here as needed
    # e.g., OPENAI_API_KEY: str | None = None

    # Pydantic settings configuration
    # Tells Pydantic to load variables from a .env file
    model_config = SettingsConfigDict(env_file=".env", extra='ignore')


# Create a single instance of the settings to be imported elsewhere
settings = Settings() 