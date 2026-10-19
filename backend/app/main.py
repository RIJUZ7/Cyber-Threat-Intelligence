"""
SENTINEL AI — Cyber Threat Intelligence & Message Forensics Platform
Main FastAPI Application Entrypoint
"""

import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .api.router import router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cyber Threat Intelligence & Message Forensics Platform Backend API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev frontends on any port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom exception handler to prevent leaking stack traces
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log securely without printing user message contents
    print(f"[SECURITY ALERT] Unhandled exception processing {request.method} {request.url.path}: {type(exc).__name__}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Forensics Engine Error",
            "message": "An unexpected error occurred during message forensics processing. No sensitive details are exposed."
        }
    )

# Include API Router
app.include_router(router)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "role": "Cyber Threat Intelligence & Message Forensics Engine",
        "status": "operational",
        "documentation": "/api/docs",
        "version": settings.VERSION
    }
