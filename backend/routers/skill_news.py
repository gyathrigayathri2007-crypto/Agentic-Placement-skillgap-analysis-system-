# backend/routers/skill_news.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from database import get_db
from models import User, SkillNews
from auth import get_current_faculty, get_current_user   # get_current_user = any authenticated user

router = APIRouter()


# ── HELPERS ───────────────────────────────────────────────────
def _serialize(post: SkillNews) -> dict:
    return {
        "id":           post.id,
        "title":        post.title,
        "body":         post.body,
        "post_type":    post.post_type,
        "priority":     post.priority,
        "skill_tag":    post.skill_tag,
        "resource_url": post.resource_url,
        "is_pinned":    post.is_pinned,
        "created_at":   str(post.created_at),
        "updated_at":   str(post.updated_at),
        "faculty_name": post.faculty.email if post.faculty else "Faculty",
    }


def _priority_order(p: str) -> int:
    return {"urgent": 0, "high": 1, "medium": 2, "low": 3}.get(p, 2)


# ═══════════════════════════════════════════════════════════════
# STUDENT ROUTES — read-only
# ═══════════════════════════════════════════════════════════════

@router.get("/news")
def get_news_for_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skill_tag: Optional[str] = Query(None),
    post_type: Optional[str] = Query(None),
):
    """
    Returns all active skill news posts for students.
    Pinned posts come first, then sorted by priority (urgent→low), then newest.
    Optionally filter by skill_tag or post_type.
    """
    query = db.query(SkillNews).filter(SkillNews.is_active == True)

    if skill_tag:
        query = query.filter(SkillNews.skill_tag.ilike(f"%{skill_tag}%"))
    if post_type:
        query = query.filter(SkillNews.post_type == post_type)

    posts = query.order_by(
        SkillNews.is_pinned.desc(),
        SkillNews.created_at.desc()
    ).all()

    # Sort: pinned first, then by priority within each group
    pinned   = [p for p in posts if p.is_pinned]
    unpinned = [p for p in posts if not p.is_pinned]

    pinned.sort(key=lambda p: _priority_order(p.priority))
    unpinned.sort(key=lambda p: (_priority_order(p.priority), p.created_at))
    unpinned.reverse()  # newest first within same priority

    ordered = pinned + unpinned

    return {
        "posts": [_serialize(p) for p in ordered],
        "total": len(ordered),
        "unread_urgent": sum(1 for p in ordered if p.priority == "urgent"),
    }


# ═══════════════════════════════════════════════════════════════
# FACULTY ROUTES — full CRUD
# ═══════════════════════════════════════════════════════════════

@router.get("/faculty/news")
def get_all_news_faculty(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
    include_inactive: bool = Query(False),
):
    """Faculty sees all their own posts including hidden ones."""
    query = db.query(SkillNews).filter(SkillNews.faculty_id == current_user.id)
    if not include_inactive:
        query = query.filter(SkillNews.is_active == True)

    posts = query.order_by(
        SkillNews.is_pinned.desc(),
        SkillNews.created_at.desc()
    ).all()

    return {"posts": [_serialize(p) for p in posts], "total": len(posts)}


@router.post("/faculty/news")
def create_news(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    """
    Create a new skill news post.

    Payload:
        title        (str, required)
        body         (str, required)
        post_type    (str) — "tip" | "trend" | "company_update" | "alert"
        priority     (str) — "low" | "medium" | "high" | "urgent"
        skill_tag    (str, optional) — e.g. "React", "AWS"
        resource_url (str, optional)
        is_pinned    (bool, optional)
    """
    title = (payload.get("title") or "").strip()
    body  = (payload.get("body")  or "").strip()

    if not title:
        raise HTTPException(status_code=400, detail="title is required")
    if not body:
        raise HTTPException(status_code=400, detail="body is required")

    valid_types     = {"tip", "trend", "company_update", "alert"}
    valid_priorities = {"low", "medium", "high", "urgent"}

    post_type = payload.get("post_type", "tip")
    priority  = payload.get("priority", "medium")

    if post_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"post_type must be one of {valid_types}")
    if priority not in valid_priorities:
        raise HTTPException(status_code=400, detail=f"priority must be one of {valid_priorities}")

    new_post = SkillNews(
        faculty_id   = current_user.id,
        title        = title,
        body         = body,
        post_type    = post_type,
        priority     = priority,
        skill_tag    = (payload.get("skill_tag") or "").strip() or None,
        resource_url = (payload.get("resource_url") or "").strip() or None,
        is_pinned    = bool(payload.get("is_pinned", False)),
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {"message": "Post created", "post": _serialize(new_post)}


@router.put("/faculty/news/{post_id}")
def update_news(
    post_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    """Update an existing post. Faculty can only edit their own posts."""
    post = db.query(SkillNews).filter(
        SkillNews.id == post_id,
        SkillNews.faculty_id == current_user.id
    ).first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if "title"        in payload: post.title        = payload["title"].strip()
    if "body"         in payload: post.body          = payload["body"].strip()
    if "post_type"    in payload: post.post_type     = payload["post_type"]
    if "priority"     in payload: post.priority      = payload["priority"]
    if "skill_tag"    in payload: post.skill_tag     = payload["skill_tag"] or None
    if "resource_url" in payload: post.resource_url  = payload["resource_url"] or None
    if "is_pinned"    in payload: post.is_pinned     = bool(payload["is_pinned"])
    if "is_active"    in payload: post.is_active     = bool(payload["is_active"])

    db.commit()
    db.refresh(post)
    return {"message": "Post updated", "post": _serialize(post)}


@router.patch("/faculty/news/{post_id}/pin")
def toggle_pin(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    """Toggle pinned status of a post."""
    post = db.query(SkillNews).filter(
        SkillNews.id == post_id,
        SkillNews.faculty_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.is_pinned = not post.is_pinned
    db.commit()
    return {"message": f"Post {'pinned' if post.is_pinned else 'unpinned'}", "is_pinned": post.is_pinned}


@router.delete("/faculty/news/{post_id}")
def delete_news(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_faculty),
):
    """Soft delete — hides post from students but keeps the record."""
    post = db.query(SkillNews).filter(
        SkillNews.id == post_id,
        SkillNews.faculty_id == current_user.id
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.is_active = False
    db.commit()
    return {"message": "Post removed from student view"}