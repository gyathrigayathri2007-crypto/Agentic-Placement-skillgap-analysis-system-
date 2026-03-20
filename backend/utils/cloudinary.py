import cloudinary
import cloudinary.uploader
from config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

def upload_file(file_bytes: bytes, filename: str, folder: str = "placement") -> str:
    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="auto",
            public_id=filename
        )
        return result.get("secure_url", "")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        return ""