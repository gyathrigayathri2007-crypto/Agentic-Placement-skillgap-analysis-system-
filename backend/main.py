from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base
import models


# Import all routers
from routers.auth_router import router as auth_router
from routers.students import router as students
from routers.companies import router as companies
from routers.faculty import router as faculty
from routers.ai import router as ai
from routers.microsoft_auth import router as microsoft_auth_router
from routers.skill_news import router as skill_news

# Create all tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Placement Management System",
    description="Agentic AI-Based Placement System API",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students, prefix="/api/students", tags=["Students"])
app.include_router(companies, prefix="/api/companies", tags=["Companies"])
app.include_router(faculty, prefix="/api/faculty", tags=["Faculty"])
app.include_router(ai, prefix="/api/ai", tags=["AI"])
app.include_router(skill_news, prefix="/api", tags=["Skill News"])
app.include_router(microsoft_auth_router)

@app.get("/")
def root():
    return {
        "message": "Smart Placement API is running!",
        "docs": "/docs",
        "status": "OK"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}