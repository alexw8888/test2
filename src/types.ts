export type ItemType = 'file' | 'folder';

export interface FileItem {
  id: string;
  name: string;
  type: ItemType;
  children?: FileItem[]; // only for folders
}
