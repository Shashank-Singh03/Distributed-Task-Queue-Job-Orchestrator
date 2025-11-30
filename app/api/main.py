"""FastAPI application and router wiring."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import routes_health, routes_jobs, routes_metrics, routes_dev


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="Distributed Task Queue & Job Orchestrator",
        version="1.0.0",
        redirect_slashes=False
    )
    
    # Add CORS middleware
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register routers - NO prefixes, routes have full paths
    app.include_router(routes_health.router, prefix="/health", tags=["health"])
    app.include_router(routes_jobs.router, tags=["jobs"])
    app.include_router(routes_metrics.router, tags=["metrics"])
    app.include_router(routes_dev.router, tags=["dev"])
    
    return app


# Create app instance
app = create_app()

