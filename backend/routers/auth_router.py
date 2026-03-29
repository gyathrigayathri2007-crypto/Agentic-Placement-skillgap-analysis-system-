# backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User, Student
from schemas import UserRegister, UserLogin
from auth import hash_password, verify_password, create_access_token, get_current_user
import uuid

router = APIRouter()

def gen_uuid():
    return str(uuid.uuid4())

@router.post("/register")
def register(data: UserRegister, response: Response, db: Session = Depends(get_db)):
    # Check email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = gen_uuid()
    user = User(
        id=user_id,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        auth_provider="local"
    )
    db.add(user)
    db.flush()  # write user before creating student

    # ✅ Always create a Student row when role = student
    # This ensures GET /profile doesn't fail later
    if data.role == "student":
        student = Student(
            id=user_id,
            name=data.email.split("@")[0],  # temp name from email
            profile_completed=False,
            readiness_score=0.0,
        )
        db.add(student)

    db.commit()

    # Auto-login after register
    token = create_access_token({"sub": user_id, "role": data.role})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # set True in production with HTTPS
        max_age=86400
    )

    return {"message": "Registered successfully", "role": data.role}


@router.post("/login")
def login(data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # ✅ If student row missing (old accounts), create it now
    if user.role == "student":
        student = db.query(Student).filter(Student.id == user.id).first()
        if not student:
            student = Student(
                id=user.id,
                name=user.email.split("@")[0],
                profile_completed=False,
                readiness_score=0.0,
            )
            db.add(student)
            db.commit()

    token = create_access_token({"sub": user.id, "role": user.role})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=86400
    )

    return {"message": "Login successful", "role": user.role}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id":            current_user.id,
        "email":         current_user.email,
        "role":          current_user.role,
        "auth_provider": current_user.auth_provider,
    }