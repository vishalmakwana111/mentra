import React, { FC } from 'react';

interface EdgeActionMenuProps {
  top: number;
  left: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void; // Optional: If needed to handle close via the component itself
}

const EdgeActionMenu: FC<EdgeActionMenuProps> = ({ top, left, onEdit, onDelete, onClose }) => {
  // Simple styling for the popover
  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: top,
    left: left,
    zIndex: 100, // Ensure it's above other elements
    background: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    padding: '5px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '4px 8px',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '12px',
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering pane click
    onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div style={menuStyle}>
      <button 
        style={{ ...buttonStyle, borderBottom: '1px solid #eee' }} 
        onMouseDown={handleEditClick} // Use onMouseDown to potentially avoid focus issues
      >
        Edit Label
      </button>
      <button 
        style={{ ...buttonStyle, color: 'red' }} 
        onMouseDown={handleDeleteClick} 
      >
        Delete Edge
      </button>
    </div>
  );
};

export default EdgeActionMenu; 