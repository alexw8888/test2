import React from 'react';
import { FileItem } from '../types';
import FileNode from './FileNode';

interface Props {
  items: FileItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  editingId: string | null;
  onStartEditing: (id: string | null) => void;
  onMove: (id: string, newParentId: string | null) => void;
}

export default function FileTree({ items, selectedId, onSelect, onRename, editingId, onStartEditing, onMove }: Props) {
  const handleDragOver: React.DragEventHandler = (e) => {
    e.preventDefault();
  };
  const handleDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onMove(id, null); // move to root
    }
  };

  return (
    <div className="file-tree" onDragOver={handleDragOver} onDrop={handleDrop}>
      {items.map(item => (
        <FileNode
          key={item.id}
          item={item}
          selectedId={selectedId}
          onSelect={onSelect}
          onRename={onRename}
          editingId={editingId}
          onStartEditing={onStartEditing}
          onMove={onMove}
          parentId={null}
        />
      ))}
    </div>
  );
}
