from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the main API router
from app.api.api_v1.api import api_router

app = FastAPI(title="Mind Map Mentor API")

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