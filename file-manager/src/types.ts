export interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FileSystemItem[];
}
