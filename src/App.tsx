import React, { useState, useCallback } from 'react';
import { FileItem } from './types';
import FileTree from './components/FileTree';

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
  const [data, setData] = useState<FileItem[]>(initialData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // helpers to find, add, delete and move items

  const findParent = useCallback((items: FileItem[], childId: string, parent: FileItem | null = null): FileItem | null => {
    for (const item of items) {
      if (item.id === childId) return parent;
      if (item.type === 'folder' && item.children) {
        const res = findParent(item.children, childId, item);
        if (res) return res;
      }
    }
    return null;
  }, []);

  const findItem = useCallback((items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === 'folder' && item.children) {
        const res = findItem(item.children, id);
        if (res) return res;
      }
    }
    return null;
  }, []);

  const addItem = useCallback((parentId: string | null, newItem: FileItem) => {
    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as FileItem[];
      let targetId = parentId;
      // If parentId refers to a file, add to its parent instead
      if (parentId) {
        const node = findItem(copy, parentId);
        if (node && node.type === 'file') {
          const p = findParent(copy, parentId);
          targetId = p ? p.id : null;
        }
      }

      if (targetId === null) {
        copy.push(newItem);
        return copy;
      }

      const parent = findItem(copy, targetId);
      if (parent && parent.type === 'folder') {
        parent.children = parent.children || [];
        parent.children.push(newItem);
      }

      return copy;
    });
    setSelectedId(newItem.id);
  }, [findItem]);

  const deleteItem = useCallback((id: string) => {
    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as FileItem[];
      const parent = findParent(copy, id);
      if (parent === null) {
        // deleting from root
        return copy.filter(item => item.id !== id);
      }
      parent.children = (parent.children || []).filter(child => child.id !== id);
      return copy;
    });
    setSelectedId(null);
  }, [findParent]);

  const renameItem = useCallback((id: string, name: string) => {
    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as FileItem[];
      const node = findItem(copy, id);
      if (node) node.name = name;
      return copy;
    });
  }, [findItem]);

  // move item to a new parent
  const moveItem = useCallback((id: string, newParentId: string | null) => {
    setData(prev => {
      const copy = JSON.parse(JSON.stringify(prev)) as FileItem[];
      // helper to check if target is descendant of node
      const isDescendant = (nodeId: string, targetId: string | null): boolean => {
        if (!targetId) return false;
        const node = findItem(copy, nodeId);
        const target = findItem(copy, targetId);
        if (!node || !target) return false;
        const stack = [node];
        while (stack.length) {
          const cur = stack.pop()!;
          if (cur.id === target.id) return true;
          if (cur.children) stack.push(...cur.children);
        }
        return false;
      };
      // find node to move and remove it
      let node: FileItem | null = null;
      const parent = findParent(copy, id);
      if (parent === null) {
        const index = copy.findIndex(i => i.id === id);
        if (index >= 0) {
          node = copy.splice(index, 1)[0];
        }
      } else {
        parent.children = parent.children || [];
        const idx = parent.children.findIndex(c => c.id === id);
        if (idx >= 0) node = parent.children.splice(idx, 1)[0];
      }
      if (!node) return copy; // nothing to move
      // do not move into descendant of itself
      if (isDescendant(node.id, newParentId)) return copy;

      if (newParentId === null) {
        copy.push(node);
      } else {
        const newParent = findItem(copy, newParentId);
        if (newParent && newParent.type === 'folder') {
          newParent.children = newParent.children || [];
          newParent.children.push(node);
        } else {
          // invalid target: put back where it was
          // put it at root to be safe
          copy.push(node);
        }
      }

      return copy;
    });
  }, [findParent, findItem]);

  const handleAddFolder = () => {
    const id = Date.now().toString();
    addItem(selectedId, { id, name: 'New Folder', type: 'folder', children: [] });
  };

  const handleAddFile = () => {
    const id = Date.now().toString();
    addItem(selectedId, { id, name: 'New File.txt', type: 'file' });
  };

  const handleDelete = () => {
    if (selectedId) deleteItem(selectedId);
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
