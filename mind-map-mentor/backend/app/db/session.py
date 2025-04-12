from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create the SQLAlchemy engine
# pool_pre_ping=True helps handle connections that might have timed out
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Create a configured "Session" class
# autocommit=False and autoflush=False are standard settings for web applications
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for FastAPI endpoints to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 