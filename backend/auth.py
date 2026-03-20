from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Cookie
from sqlalchemy.orm import Session
from database import get_db
from models import User
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── PASSWORD UTILS ────────────────────────────────────────────
def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")[:72]
    return pwd_context.hash(password_bytes)

def verify_password(plain_password: str, password_hash: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:72]
    return pwd_context.verify(password_bytes, password_hash)

# ── JWT UTILS ─────────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    # Ensure sub is always a string (UUID ids must be strings)
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# ── CURRENT USER DEPENDENCY ───────────────────────────────────
def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated"
    )
    if not access_token:
        raise credentials_exception

    payload = decode_token(access_token)
    if not payload:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    # id is String(36) UUID — query as string
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception

    return user

# ── ROLE DEPENDENCIES ─────────────────────────────────────────
def get_current_student(current_user: User = Depends(get_current_user)):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Students only."
        )
    return current_user

def get_current_faculty(current_user: User = Depends(get_current_user)):
    if current_user.role != "faculty":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Faculty only."
        )
    return current_user