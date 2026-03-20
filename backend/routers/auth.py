from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Student
from schemas import UserRegister, UserLogin, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()

@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        auth_provider="local"           # always "local" for normal registration
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-create empty student record so profile setup works immediately
    if user_data.role == "student":
        new_student = Student(id=new_user.id, name="")
        db.add(new_student)
        db.commit()

    return {"message": "Registration successful", "role": new_user.role}

@router.post("/login")
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Block Microsoft OAuth users from logging in with password
    if user.auth_provider == "microsoft":
        raise HTTPException(
            status_code=400,
            detail="This account uses Microsoft sign-in. Please use 'Continue with Microsoft'."
        )

    if not user.password_hash or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": user.id, "role": user.role})

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=86400,
        samesite="lax"
    )

    return {
        "message": "Login successful",
        "role": user.role,
        "user_id": user.id,
        "email": user.email
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out successfully"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "auth_provider": current_user.auth_provider
    }