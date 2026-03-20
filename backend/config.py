from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    GEMINI_API_KEY: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Microsoft OAuth
    MICROSOFT_CLIENT_ID: str
    MICROSOFT_TENANT_ID: str
    MICROSOFT_CLIENT_SECRET: str
    MICROSOFT_REDIRECT_URI: str = "http://localhost:8000/api/auth/microsoft/callback"

    class Config:
        env_file = ".env"

settings = Settings()