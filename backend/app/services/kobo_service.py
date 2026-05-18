"""KoBoToolbox API service — real integration with KoBo API v2."""
import httpx
from typing import Optional
from app.config import settings


KOBO_BASE = getattr(settings, "KOBO_API_URL", "https://kf.kobotoolbox.org/api/v2")
KOBO_TOKEN = getattr(settings, "KOBO_API_TOKEN", "")


def _headers():
    if not KOBO_TOKEN:
        return {}
    return {"Authorization": f"Token {KOBO_TOKEN}"}


async def list_kobo_assets():
    """Fetch list of forms/assets from KoBoToolbox."""
    if not KOBO_TOKEN:
        return {"error": "KOBO_API_TOKEN not configured", "assets": []}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{KOBO_BASE}/assets/", headers=_headers(), params={"format": "json"})
        resp.raise_for_status()
        data = resp.json()
    results = data.get("results", [])
    return {
        "count": data.get("count", len(results)),
        "assets": [
            {
                "uid": a["uid"],
                "name": a.get("name", ""),
                "asset_type": a.get("asset_type", ""),
                "deployment_status": a.get("deployment_status", ""),
                "submissions": a.get("deployment__submission_count", 0),
            }
            for a in results
        ],
    }


async def fetch_kobo_submissions(asset_uid: str, limit: int = 100):
    """Fetch submissions for a specific KoBo asset."""
    if not KOBO_TOKEN:
        return {"error": "KOBO_API_TOKEN not configured", "submissions": []}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{KOBO_BASE}/assets/{asset_uid}/data/",
            headers=_headers(),
            params={"format": "json", "limit": limit},
        )
        resp.raise_for_status()
        data = resp.json()
    return {
        "count": data.get("count", 0),
        "submissions": data.get("results", []),
    }


async def push_form_to_kobo(xlsform_data: dict):
    """Create a new form in KoBoToolbox from XLSForm data."""
    if not KOBO_TOKEN:
        return {"error": "KOBO_API_TOKEN not configured"}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{KOBO_BASE}/assets/",
            headers={**_headers(), "Content-Type": "application/json"},
            json={
                "name": xlsform_data.get("form_title", "HIAOS Form"),
                "asset_type": "survey",
                "content": {
                    "survey": xlsform_data.get("survey", []),
                    "choices": xlsform_data.get("choices", []),
                    "settings": xlsform_data.get("settings", {}),
                },
            },
        )
        resp.raise_for_status()
        return resp.json()
