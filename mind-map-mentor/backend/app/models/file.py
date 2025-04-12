from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, index=True, nullable=False)
    # For local dev, store relative path within a designated upload folder
    storage_path = Column(String, unique=True, index=True, nullable=False)
    mime_type = Column(String)
    size = Column(BigInteger) # Use BigInteger for potentially large files
    # Foreign key to the generic graph node
    graph_node_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # updated_at might not be needed unless files are mutable

    # Relationship back to User
    owner = relationship("User", back_populates="files")

    # Optional: Relationship to the GraphNode (Uncomment if needed)
    # graph_node = relationship("GraphNode", back_populates="source_file")

    # Potential future relationship to GraphNode (optional)
    # graph_node_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=True)
    # graph_node = relationship("GraphNode", back_populates="source_file") 