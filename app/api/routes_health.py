"""Health check endpoints."""

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/live")
async def health_live() -> JSONResponse:
    """Liveness probe endpoint."""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "ok"}
    )


@router.get("/ready")
async def health_ready() -> JSONResponse:
    """Readiness probe endpoint."""
    # TODO: Add Redis connectivity check in later phase
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"status": "ready"}
    )

