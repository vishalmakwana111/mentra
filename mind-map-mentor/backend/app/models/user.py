from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean(), default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships (will be defined/refined later)
    notes = relationship("Note", back_populates="owner", cascade="all, delete-orphan")
    files = relationship("File", back_populates="owner", cascade="all, delete-orphan")
    graph_nodes = relationship("GraphNode", back_populates="owner", cascade="all, delete-orphan")
    graph_edges = relationship("GraphEdge", back_populates="owner", cascade="all, delete-orphan") 