export interface FileStructure {
  path: string;
  content: string;
  type: 'file' | 'folder';
  is_binary?: boolean;
  size?: number;
  modified?: number;
  isLoaded?: boolean;
  children?: FileStructure[];
}
