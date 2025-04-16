from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), index=True)
    content = Column(Text, nullable=False)
    user_summary = Column(String(300), nullable=True)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    graph_node_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationship back to User
    owner = relationship("User", back_populates="notes")

    # Potential future relationship to GraphNode (optional)
    graph_node = relationship("GraphNode", back_populates="original_note")

    # Add index on user_id and updated_at for potential filtering/sorting
    __table_args__ = (Index('ix_notes_user_id_updated_at', 'user_id', 'updated_at'),) 