import httpx
import msal
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models import User
from auth import create_access_token

router = APIRouter(prefix="/api/auth/microsoft", tags=["Microsoft OAuth"])

def get_msal_app():
    return msal.ConfidentialClientApplication(
        client_id=settings.MICROSOFT_CLIENT_ID,
        client_credential=settings.MICROSOFT_CLIENT_SECRET,
        authority=f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}"
    )

@router.get("")
def microsoft_login():
    """Redirect user to Microsoft login page."""
    msal_app = get_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        scopes=["User.Read"],
        redirect_uri=settings.MICROSOFT_REDIRECT_URI
    )
    return RedirectResponse(auth_url)

@router.get("/callback")
async def microsoft_callback(code: str, db: Session = Depends(get_db)):
    """Handle Microsoft OAuth callback."""
    msal_app = get_msal_app()

    # Exchange auth code for access token
    result = msal_app.acquire_token_by_authorization_code(
        code=code,
        scopes=["User.Read"],
        redirect_uri=settings.MICROSOFT_REDIRECT_URI
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=f"OAuth error: {result.get('error_description')}")

    access_token = result["access_token"]

    # Fetch user profile from Microsoft Graph API
    async with httpx.AsyncClient() as client:
        graph_response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    
    if graph_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch Microsoft profile")

    ms_user = graph_response.json()

    ms_id = ms_user.get("id")
    email = ms_user.get("mail") or ms_user.get("userPrincipalName")
    first_name = ms_user.get("givenName", "")
    last_name = ms_user.get("surname", "")

    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Microsoft account")

    # Upsert user into your MySQL database
    user = db.query(User).filter(User.microsoft_id == ms_id).first()

    if not user:
        # Check if email already exists (registered manually before)
        user = db.query(User).filter(User.email == email).first()
        if user:
            # Link Microsoft ID to existing account
            user.microsoft_id = ms_id
        else:
            # Brand new user — create them
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                microsoft_id=ms_id,
                hashed_password=None,
                role="student"  # default role; can be changed later
            )
            db.add(user)

    db.commit()
    db.refresh(user)

    # Issue your own JWT cookie (same as normal login)
    jwt_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    response = RedirectResponse(url="http://localhost:5173/dashboard")
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    return response