import React, { useState } from 'react';
import { FileItem } from './types';
import FileTree from './components/FileTree';
import useFileSystem from './hooks/useFileSystem';

const initialData: FileItem[] = [
  { id: '1', name: 'Documents', type: 'folder', children: [
      { id: '2', name: 'Resume.pdf', type: 'file' },
      { id: '3', name: 'Notes', type: 'folder', children: [] }
    ]
  },
  { id: '4', name: 'Photos', type: 'folder', children: [
      { id: '5', name: 'Vacation', type: 'folder', children: [
          { id: '6', name: 'beach.png', type: 'file' }
        ]
      }
    ]
  }
];

export default function App() {
  const { data, addItem, deleteItem, renameItem, moveItem, undo, canUndo } = useFileSystem(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);



  const handleAddFolder = () => {
    const id = Date.now().toString();
    addItem(selectedId, { id, name: 'New Folder', type: 'folder', children: [] });
    setSelectedId(id);
  };

  const handleAddFile = () => {
    const id = Date.now().toString();
    addItem(selectedId, { id, name: 'New File.txt', type: 'file' });
    setSelectedId(id);
  };

  const handleDelete = () => {
    if (selectedId) deleteItem(selectedId);
    setSelectedId(null);
  };

  const handleRename = () => {
    if (selectedId) setEditingId(selectedId);
  };

  return (
    <div className="app">
      <header>
        <h1>Virtual OS File Manager</h1>
      </header>
      <div className="toolbar">
        <button onClick={handleAddFolder}>Add Folder</button>
        <button onClick={handleAddFile}>Add File</button>
        <button onClick={handleRename} disabled={!selectedId}>Rename</button>
        <button onClick={handleDelete} disabled={!selectedId}>Delete</button>
        <button onClick={undo} disabled={!canUndo}>Undo</button>
      </div>
      <div className="content">
        <FileTree
          items={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onRename={(id, name) => {
            renameItem(id, name);
            setEditingId(null);
          }}
          editingId={editingId}
          onStartEditing={setEditingId}
          onMove={moveItem}
        />
      </div>
    </div>
  );
}
