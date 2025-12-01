import { useState } from 'react';
import './App.css';
import type { FileSystemItem } from './types';
import { FileSystemNode } from './components/FileSystemNode';

const initialData: FileSystemItem[] = [
  { id: "1", name: "Documents", type: "folder", children: [
      { id: "2", name: "Resume.pdf", type: "file" },
      { id: "3", name: "Notes", type: "folder", children: [] }
  ]},
  { id: "4", name: "Photos", type: "folder", children: [
      { id: "5", name: "Vacation", type: "folder", children: [
          { id: "6", name: "beach.png", type: "file" }
      ]}
  ]}
];

// --- Helpers ---

const findNode = (nodes: FileSystemItem[], id: string): FileSystemItem | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

const deleteNodeFromTree = (nodes: FileSystemItem[], id: string): FileSystemItem[] => {
    return nodes.filter(node => node.id !== id).map(node => {
        if (node.children) {
            return { ...node, children: deleteNodeFromTree(node.children, id) };
        }
        return node;
    });
};

const addNodeToTree = (nodes: FileSystemItem[], parentId: string, newNode: FileSystemItem): FileSystemItem[] => {
    return nodes.map(node => {
        if (node.id === parentId) {
            return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
            return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
        }
        return node;
    });
};

const renameNodeInTree = (nodes: FileSystemItem[], id: string, newName: string): FileSystemItem[] => {
    return nodes.map(node => {
        if (node.id === id) {
            return { ...node, name: newName };
        }
        if (node.children) {
            return { ...node, children: renameNodeInTree(node.children, id, newName) };
        }
        return node;
    });
};

const isDescendant = (parent: FileSystemItem, targetId: string): boolean => {
    if (parent.id === targetId) return true; // Should not be dragged onto itself, but good check
    if (!parent.children) return false;
    for (const child of parent.children) {
        if (child.id === targetId) return true;
        if (isDescendant(child, targetId)) return true;
    }
    return false;
}

function App() {
  const [data, setData] = useState<FileSystemItem[]>(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1', '4']));

  const handleToggle = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleRename = (id: string, newName: string) => {
    setData(prev => renameNodeInTree(prev, id, newName));
  };

  const handleAdd = (type: 'folder' | 'file') => {
      if (!selectedId) {
          alert("Please select a folder to add to.");
          return;
      }
      const selectedNode = findNode(data, selectedId);
      if (!selectedNode) return;
      
      if (selectedNode.type !== 'folder') {
          alert("Cannot add to a file. Please select a folder.");
          return;
      }

      const newId = Date.now().toString();
      const newItem: FileSystemItem = {
          id: newId,
          name: type === 'folder' ? 'New Folder' : 'New File',
          type,
          children: type === 'folder' ? [] : undefined
      };

      setData(prev => addNodeToTree(prev, selectedId, newItem));
      setExpandedIds(prev => new Set(prev).add(selectedId));
  };

  const handleDelete = () => {
      if (!selectedId) return;
      if (window.confirm("Are you sure you want to delete this item?")) {
          setData(prev => deleteNodeFromTree(prev, selectedId));
          setSelectedId(null);
      }
  };

  const handleDropItem = (draggedId: string, targetId: string) => {
    const draggedNode = findNode(data, draggedId);
    if (!draggedNode) return;

    const targetNode = findNode(data, targetId);
    if (!targetNode || targetNode.type !== 'folder') return;

    // Prevent moving a folder into itself or its children
    if (draggedNode.type === 'folder' && isDescendant(draggedNode, targetId)) {
         alert("Cannot move a folder into its own child.");
         return;
    }

    // Optimistic update? No, strict state update
    const dataWithoutDragged = deleteNodeFromTree(data, draggedId);
    const finalTree = addNodeToTree(dataWithoutDragged, targetId, draggedNode);
    
    setData(finalTree);
    setExpandedIds(prev => new Set(prev).add(targetId)); // Expand target to show dropped item
  };

  return (
    <div className="app-container">
      <h1>Virtual OS File Manager</h1>
      <div className="toolbar">
        <button onClick={() => handleAdd('folder')}>Add Folder</button>
        <button onClick={() => handleAdd('file')}>Add File</button>
        <button onClick={handleDelete} disabled={!selectedId}>Delete</button>
      </div>
      <div className="file-browser">
        {data.map(item => (
          <FileSystemNode
            key={item.id}
            item={item}
            selectedId={selectedId}
            onSelect={handleSelect}
            onToggle={handleToggle}
            onRename={handleRename}
            onDropItem={handleDropItem}
            expandedIds={expandedIds}
          />
        ))}
      </div>
      <div className="instructions">
         <p>Double-click to rename. Drag and drop to move items.</p>
      </div>
    </div>
  );
}

export default App;