from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_node_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=False)
    target_node_id = Column(Integer, ForeignKey("graph_nodes.id"), nullable=False)
    relationship_type = Column(String, index=True, default="related") # e.g., 'related', 'contains', 'part_of'
    # Store flexible edge properties (e.g., weight, description)
    data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship back to User
    owner = relationship("User", back_populates="graph_edges")

    # Relationships to source and target nodes
    source_node = relationship(
        "GraphNode",
        foreign_keys=[source_node_id],
        back_populates="edges_from"
    )
    target_node = relationship(
        "GraphNode",
        foreign_keys=[target_node_id],
        back_populates="edges_to"
    ) 