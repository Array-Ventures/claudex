import type { FileStructure } from '@/types';
import { logger } from '@/utils/logger';

const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  css: 'css',
  scss: 'scss',
  less: 'less',
  html: 'html',
  json: 'json',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  h: 'c',
  hpp: 'cpp',
  rs: 'rust',
  go: 'go',
  rb: 'ruby',
  php: 'php',
  cs: 'csharp',
  sql: 'sql',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  txt: 'plaintext',
  xml: 'xml',
  graphql: 'graphql',
  gql: 'graphql',
  svelte: 'svelte',
  vue: 'vue',
  astro: 'astro',
};

function sortFiles(files: FileStructure[]): FileStructure[] {
  const sorted = [...files].sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.path.localeCompare(b.path);
  });

  return sorted.map((item) =>
    item.type === 'folder' && item.children
      ? { ...item, children: sortFiles(item.children) }
      : item,
  );
}

export function getFileName(path: string): string {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

export function findFileInStructure(
  items: FileStructure[],
  path: string,
): FileStructure | undefined {
  for (const file of items) {
    if (file.path === path) return file;
    if (file.type === 'folder' && file.children) {
      const found = findFileInStructure(file.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

export function detectLanguage(path: string): string {
  if (!path) return 'javascript';

  const extension = path.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_MAP[extension] || 'plaintext';
}

// Builds a flat path→file lookup map from a nested file structure.
// Enables O(1) file lookups during file structure construction.
const buildPathMap = (files: FileStructure[], pathToFile: Map<string, FileStructure>) => {
  files.forEach((file) => {
    pathToFile.set(file.path, file);
    if (file.type === 'folder' && file.children) {
      buildPathMap(file.children, pathToFile);
    }
  });
};

// Creates all intermediate directories for a given path, similar to `mkdir -p`.
// For path "a/b/c", creates directories "a", "a/b", "a/b/c" if they don't exist,
// properly linking each child folder to its parent.
const createDirectoryPath = (
  dirPath: string,
  pathToFile: Map<string, FileStructure>,
  newFileStructure: FileStructure[],
) => {
  const normalizedDirPath = dirPath.replace(/^\.?\/+/, '');
  if (!normalizedDirPath) return;

  const pathParts = normalizedDirPath.split('/').filter((part) => part);
  let currentPath = '';

  // Incrementally build path, creating missing directories at each level
  pathParts.forEach((part) => {
    const parentPath = currentPath;
    currentPath = currentPath ? `${currentPath}/${part}` : part;

    if (!pathToFile.has(currentPath)) {
      const newDir: FileStructure = {
        path: currentPath,
        type: 'folder',
        content: '',
        children: [],
      };

      pathToFile.set(currentPath, newDir);

      // Attach to parent if exists, otherwise add to root level
      if (parentPath) {
        const parent = pathToFile.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(newDir);
        }
      } else {
        newFileStructure.push(newDir);
      }
    }
  });
};

// Converts a flat array of sandbox files into a nested tree structure.
// Merges with existing structure if provided, creating intermediate directories as needed.
// Algorithm: Build path lookup map → Process each file → Create parent dirs → Attach to tree → Sort.
export function buildFileStructureFromSandboxFiles(
  sandboxFiles: Array<{
    path: string;
    content?: string;
    type: string;
    is_binary?: boolean;
    size?: number;
    modified?: number;
  }>,
  existingFileStructure: FileStructure[] = [],
): FileStructure[] {
  if (!Array.isArray(sandboxFiles)) {
    return existingFileStructure;
  }

  // Deep clone to avoid mutating the existing structure
  const newFileStructure: FileStructure[] =
    typeof structuredClone === 'function'
      ? structuredClone(existingFileStructure)
      : JSON.parse(JSON.stringify(existingFileStructure));
  const pathToFile: Map<string, FileStructure> = new Map();

  // Index existing files for O(1) lookups
  buildPathMap(newFileStructure, pathToFile);

  sandboxFiles.forEach((file) => {
    try {
      const normalizedPath = file.path.replace(/^\.?\/+/, '');
      if (!normalizedPath) {
        return;
      }

      if (file.type === 'directory') {
        createDirectoryPath(normalizedPath, pathToFile, newFileStructure);
      } else if (file.type === 'file') {
        if (pathToFile.has(normalizedPath)) {
          return;
        }

        const pathParts = normalizedPath.split('/');
        pathParts.pop();
        const dirPath = pathParts.join('/');

        const newFile: FileStructure = {
          path: normalizedPath,
          type: 'file',
          content: file.content || '',
          is_binary: file.is_binary,
          size: file.size,
          modified: file.modified,
          isLoaded: !!file.content,
        };

        if (dirPath) {
          createDirectoryPath(dirPath, pathToFile, newFileStructure);
          const parent = pathToFile.get(dirPath);
          if (parent && parent.children) {
            parent.children.push(newFile);
          }
        } else {
          newFileStructure.push(newFile);
        }

        pathToFile.set(normalizedPath, newFile);
      }
    } catch (error) {
      logger.error('File structure build failed', 'file', error);
    }
  });

  return sortFiles(newFileStructure);
}

export function hasActualFiles(files: FileStructure[]): boolean {
  for (const file of files) {
    if (file.type === 'file') {
      return true;
    }
    if (file.type === 'folder' && file.children && hasActualFiles(file.children)) {
      return true;
    }
  }
  return false;
}

// Generic depth-first traversal of file structure with transformation.
// Applies processor to each item and collects non-null results.
// Useful for flattening, searching, or transforming the tree.
export function traverseFileStructure<T>(
  items: FileStructure[],
  processor: (item: FileStructure, parentPath: string) => T | null,
  parentPath = '',
): T[] {
  const result: T[] = [];

  items.forEach((item) => {
    const processed = processor(item, parentPath);
    if (processed !== null) {
      result.push(processed);
    }

    if (item.type === 'folder' && item.children) {
      result.push(...traverseFileStructure(item.children, processor, item.path));
    }
  });

  return result;
}

export const convertDataUrlToUploadedFile = async (
  dataUrl: string,
  filename: string = 'image.png',
  type: string = 'image/png',
): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type });
};
