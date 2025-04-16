from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class GraphNode(Base):
    __tablename__ = "graph_nodes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String, index=True)
    node_type = Column(String, index=True, nullable=False, default='note')
    # Store flexible node properties (e.g., description, source_type)
    data = Column(JSON) # Using JSON for flexibility
    # Store position for frontend rendering
    position = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to User
    owner = relationship("User", back_populates="graph_nodes")

    # Relationships to Edges (where this node is a source or target)
    edges_from = relationship(
        "GraphEdge",
        foreign_keys="GraphEdge.source_node_id",
        back_populates="source_node",
        cascade="all, delete-orphan"
    )
    edges_to = relationship(
        "GraphEdge",
        foreign_keys="GraphEdge.target_node_id",
        back_populates="target_node",
        cascade="all, delete-orphan"
    )

    # Relationship back to the original Note that this GraphNode represents
    original_note = relationship("Note", back_populates="graph_node")

    # Optional: Relationship back to the original File (if you have a File model)
    # original_file = relationship("File", back_populates="graph_node") # Adjust if needed 