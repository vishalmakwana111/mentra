import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import the main API router
from app.api.api_v1.api import api_router
from app.core.config import settings
from app.core.storage import ensure_storage_path_exists # Import the util

# --- Logging Configuration ---
# Configure logging to output to stdout with a specific format and level
logging.basicConfig(
    level=logging.DEBUG,  # Set the default level (e.g., INFO, DEBUG)
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)  # Output logs to the console
    ]
)
# --- End Logging Configuration ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("Starting up...")
    ensure_storage_path_exists() # Ensure storage path exists
    yield
    # Code to run on shutdown
    print("Shutting down...")

app = FastAPI(
    title="Mind Map Mentor API",
    openapi_url=f"/api/v1/openapi.json",
    lifespan=lifespan # Add the lifespan context manager
)

# Configure CORS
origins = [
    "http://localhost:3000",
    # You might add other origins here if needed, e.g., your deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """
    Health check endpoint.
    """
    return {"message": "Mind Map Mentor API is running!"}

# Include the API router
app.include_router(api_router, prefix="/api/v1") 