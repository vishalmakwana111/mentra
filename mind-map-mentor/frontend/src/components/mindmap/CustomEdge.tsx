import React, { FC, useState, useCallback, useEffect } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from 'reactflow';

// Custom Edge component to allow inline label editing
const CustomEdge: FC<EdgeProps> = ({ 
    id, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY, 
    sourcePosition, 
    targetPosition, 
    data, 
    markerEnd, 
    style 
}) => {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // State for editing
    const [isEditing, setIsEditing] = useState(false);
    const [editedLabel, setEditedLabel] = useState(data?.label || '');

    // Reference to the input element for focus
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Handle double click to start editing
    const onEdgeDoubleClick = useCallback(() => {
        setEditedLabel(data?.label || '');
        setIsEditing(true);
        console.log(`Started editing edge ${id}`);
    }, [id, data?.label]);

    // Handle blur to potentially save
    const onLabelBlur = useCallback(() => {
        console.log(`Edge ${id} label input blurred.`);
        // Save logic will be handled by the parent MindMapCanvas via onEdgeUpdate
        // For now, just exit editing mode
        // We *could* call an onEdgeUpdate prop here if passed down
        setIsEditing(false);
    }, [id]);

    // Handle key down (Enter to save/blur, Escape to cancel)
    const onLabelKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            inputRef.current?.blur(); // Trigger blur to save
        }
        if (event.key === 'Escape') {
            setEditedLabel(data?.label || ''); // Revert
            setIsEditing(false);
        }
    }, [data?.label]);

    // Focus the input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    return (
        <>
            <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                    onDoubleClick={onEdgeDoubleClick} // Trigger editing
                >
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editedLabel}
                            onChange={(e) => setEditedLabel(e.target.value)}
                            onBlur={onLabelBlur} // Trigger save attempt
                            onKeyDown={onLabelKeyDown}
                            className="px-1 py-0.5 border border-blue-400 rounded bg-white shadow-sm"
                            style={{ minWidth: '50px' }} // Basic styling
                        />
                    ) : (
                        // Render label only if it exists
                        data?.label && <div className="react-flow__edge-label bg-white bg-opacity-70 px-1 rounded">{data.label}</div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default CustomEdge; 