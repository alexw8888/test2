import React, { useState } from 'react';
import type { FileSystemItem } from '../types';

interface Props {
  item: FileSystemItem;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDropItem: (draggedId: string, targetId: string) => void;
  expandedIds: Set<string>;
}

export const FileSystemNode: React.FC<Props> = ({
  item,
  selectedId,
  onSelect,
  onToggle,
  onRename,
  onDropItem,
  expandedIds,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id }));
    e.stopPropagation(); 
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const { id: draggedId } = JSON.parse(data);
      if (draggedId !== item.id) {
        onDropItem(draggedId, item.id);
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(item.name);
  };

  const handleRenameSubmit = () => {
    if (editName.trim()) {
      onRename(item.id, editName);
    } else {
        setEditName(item.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
        setEditName(item.name);
        setIsEditing(false);
    }
  };

  const isFolder = item.type === 'folder';
  const isExpanded = expandedIds.has(item.id);
  const isSelected = selectedId === item.id;

  return (
    <div className="file-system-node">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={isFolder ? handleDragOver : undefined}
        onDrop={isFolder ? handleDrop : undefined}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
            e.stopPropagation();
            onSelect(item.id);
        }}
        className={`node-row ${isSelected ? 'selected' : ''}`}
        style={{ 
            paddingLeft: '5px',
            cursor: 'pointer',
            border: isSelected ? '1px solid #99c2ff' : '1px solid transparent',
            backgroundColor: isSelected ? '#e6f2ff' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none'
        }}
      >
        <span 
            onClick={(e) => {
               if (isFolder) {
                   e.stopPropagation(); 
                   onToggle(item.id);
               }
            }}
            style={{ 
                marginRight: '5px', 
                cursor: isFolder ? 'pointer' : 'default',
                width: '15px',
                display: 'inline-block',
                textAlign: 'center'
            }}
        >
          {isFolder ? (isExpanded ? '▼' : '▶') : ''} 
        </span>
        
        <span style={{ marginRight: '8px', fontSize: '1.2em' }}>
             {isFolder ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>

        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'inherit' }}
          />
        ) : (
          <span>{item.name}</span>
        )}
      </div>

      {isFolder && isExpanded && item.children && (
        <div style={{ paddingLeft: '20px' }}>
          {item.children.map((child) => (
            <FileSystemNode
              key={child.id}
              item={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggle={onToggle}
              onRename={onRename}
              onDropItem={onDropItem}
              expandedIds={expandedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
};
