import React, { useState, useRef } from 'react';
import { FileItem } from '../types';

interface Props {
  item: FileItem;
  parentId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  editingId: string | null;
  onStartEditing: (id: string | null) => void;
  onMove: (id: string, newParentId: string | null) => void;
}

export default function FileNode({ item, parentId, selectedId, onSelect, onRename, editingId, onStartEditing, onMove }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  const isSelected = selectedId === item.id;
  const isEditing = editingId === item.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartEditing(item.id);
  };

  const onDragStart: React.DragEventHandler = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver: React.DragEventHandler = (e) => {
    // allow drop into folders
    if (item.type === 'folder') {
      e.preventDefault();
    }
  };

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain');
    if (id && id !== item.id) {
      if (item.type === 'folder') {
        onMove(id, item.id);
      } else {
        // cannot drop into files; move to parent
        onMove(id, parentId);
      }
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('rename') as HTMLInputElement;
    if (!input) return;
    onRename(item.id, input.value.trim() || item.name);
  };

  return (
    <div
      className={`file-node ${isSelected ? 'selected' : ''}`}
      ref={nodeRef}
      draggable
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className="node-header">
        {item.type === 'folder' && (
          <button className="collapse-btn" onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}>
            {collapsed ? '+' : '-'}
          </button>
        )}
        <div className="node-icon">{item.type === 'folder' ? '📁' : '📄'}</div>
        {isEditing ? (
          <form onSubmit={handleRenameSubmit} className="rename-form">
            <input name="rename" defaultValue={item.name} autoFocus onBlur={(e) => { onRename(item.id, e.currentTarget.value.trim() || item.name); }} />
          </form>
        ) : (
          <div className="node-name">{item.name}</div>
        )}
      </div>

      {item.type === 'folder' && !collapsed && item.children && (
        <div className="children">
          {item.children.map(child => (
            <FileNode
              key={child.id}
              item={child}
              parentId={item.id}
              selectedId={selectedId}
              onSelect={onSelect}
              onRename={onRename}
              editingId={editingId}
              onStartEditing={onStartEditing}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
