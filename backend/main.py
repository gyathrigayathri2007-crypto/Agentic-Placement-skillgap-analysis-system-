from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base
import models


# Import all routers
from routers import auth, students, companies, faculty, ai
from routers.microsoft_auth import router as microsoft_auth_router

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
    allow_origins=[settings.ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])
app.include_router(faculty.router, prefix="/api/faculty", tags=["Faculty"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
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