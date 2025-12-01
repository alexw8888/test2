import { useReducer, useCallback } from 'react';
import { FileItem } from '../types';

type FSState = {
  past: FileItem[][];
  present: FileItem[];
};

type FSAction =
  | { type: 'INIT'; data: FileItem[] }
  | { type: 'ADD'; parentId: string | null; item: FileItem }
  | { type: 'DELETE'; id: string }
  | { type: 'RENAME'; id: string; name: string }
  | { type: 'MOVE'; id: string; newParentId: string | null }
  | { type: 'UNDO' };

function deepClone(items: FileItem[]): FileItem[] {
  return JSON.parse(JSON.stringify(items)) as FileItem[];
}

function deepCloneItem(item: FileItem): FileItem {
  return JSON.parse(JSON.stringify(item)) as FileItem;
}

function findItem(items: FileItem[], id: string): FileItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.type === 'folder' && item.children) {
      const res = findItem(item.children, id);
      if (res) return res;
    }
  }
  return null;
}

function findParent(items: FileItem[], childId: string, parent: FileItem | null = null): FileItem | null {
  for (const item of items) {
    if (item.id === childId) return parent;
    if (item.type === 'folder' && item.children) {
      const res = findParent(item.children, childId, item);
      if (res) return res;
    }
  }
  return null;
}

function isDescendant(copy: FileItem[], nodeId: string, targetId: string | null) {
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
}

function reducer(state: FSState, action: FSAction): FSState {
  switch (action.type) {
    case 'INIT': {
      return { past: [], present: deepClone(action.data) };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const past = state.past.slice(0, -1);
      const prev = state.past[state.past.length - 1];
      return { past, present: deepClone(prev) };
    }
    default: {
      // for updates, compute new present and push current present to past
      const copy = deepClone(state.present);

      let newPresent = copy;

      switch (action.type) {
        case 'ADD': {
          let targetId = action.parentId;
          // if a file is passed as parent, add to its parent
          if (targetId) {
            const node = findItem(copy, targetId);
            if (node && node.type === 'file') {
              const p = findParent(copy, targetId);
              targetId = p ? p.id : null;
            }
          }
          if (targetId === null) {
            copy.push(action.item);
          } else {
            const parent = findItem(copy, targetId);
            if (parent && parent.type === 'folder') {
              parent.children = parent.children || [];
              parent.children.push(action.item);
            }
          }

          newPresent = copy;
          break;
        }
        case 'DELETE': {
          const id = action.id;
          const parent = findParent(copy, id);
          if (parent === null) {
            newPresent = copy.filter(item => item.id !== id);
          } else {
            parent.children = (parent.children || []).filter(c => c.id !== id);
            newPresent = copy;
          }
          break;
        }
        case 'RENAME': {
          const node = findItem(copy, action.id);
          if (node) node.name = action.name;
          newPresent = copy;
          break;
        }
        case 'MOVE': {
          const id = action.id;
          const newParentId = action.newParentId;

          // find and remove node
          let node: FileItem | null = null;
          const parent = findParent(copy, id);
          if (parent === null) {
            const index = copy.findIndex(i => i.id === id);
            if (index >= 0) node = copy.splice(index, 1)[0];
          } else {
            parent.children = parent.children || [];
            const idx = parent.children.findIndex(c => c.id === id);
            if (idx >= 0) node = parent.children.splice(idx, 1)[0];
          }
          if (!node) {
            newPresent = copy; // nothing to move
            break;
          }

          // do not move into descendant of itself
          if (isDescendant(copy, node.id, newParentId)) {
            // invalid; put it back to root
            copy.push(node);
            newPresent = copy;
            break;
          }

          if (newParentId === null) {
            copy.push(node);
          } else {
            const newParent = findItem(copy, newParentId);
            if (newParent && newParent.type === 'folder') {
              newParent.children = newParent.children || [];
              newParent.children.push(node);
            } else {
              copy.push(node);
            }
          }

          newPresent = copy;
          break;
        }
      }

      return { past: [...state.past, deepClone(state.present)], present: newPresent };
    }
  }
}

export default function useFileSystem(initialData: FileItem[]) {
  const [state, dispatch] = useReducer(reducer, { past: [], present: deepClone(initialData) });

  const addItem = useCallback((parentId: string | null, newItem: FileItem) => {
    dispatch({ type: 'ADD', parentId, item: deepCloneItem(newItem) });
  }, []);

  const deleteItem = useCallback((id: string) => {
    dispatch({ type: 'DELETE', id });
  }, []);

  const renameItem = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME', id, name });
  }, []);

  const moveItem = useCallback((id: string, newParentId: string | null) => {
    dispatch({ type: 'MOVE', id, newParentId });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  return {
    data: state.present,
    addItem,
    deleteItem,
    renameItem,
    moveItem,
    undo,
    canUndo: state.past.length > 0,
  };
}
