import { useCallback } from 'react';
import { useUIStore } from '@/store';
import type * as monaco from 'monaco-editor';

const DARK_THEME: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: '', foreground: 'BDBDBD', background: '#09090b' },
    { token: 'comment', foreground: '7E7E7E', fontStyle: 'italic' },
    { token: 'keyword', foreground: '7895C6' },
    { token: 'string', foreground: 'C49B66' },
    { token: 'number', foreground: 'A5C186' },
    { token: 'type', foreground: '7EB0B0' },
    { token: 'variable', foreground: '8EACC3' },
    { token: 'function', foreground: 'C0B18C' },
  ],
  colors: {
    'editor.background': '#09090b',
    'editor.foreground': '#BDBDBD',
    'editorLineNumber.foreground': '#959595',
    'editorLineNumber.activeForeground': '#B0B0B0',
    'editor.selectionBackground': '#333333',
    'editor.inactiveSelectionBackground': '#282828',
    'editorCursor.foreground': '#AEAEAE',
    'editor.findMatchBackground': '#363636',
    'editor.findMatchHighlightBackground': '#464646',
    'editorSuggestWidget.background': '#1B1B1B',
    'editorSuggestWidget.foreground': '#AEAEAE',
    'editorSuggestWidget.selectedBackground': '#282828',
    'editorWidget.background': '#1B1B1B',
    'editorWidget.border': '#363636',
  },
};

export function useEditorTheme() {
  const theme = useUIStore((state) => state.theme);

  const setupEditorTheme = useCallback(
    (monaco: typeof import('monaco-editor')) => {
      if (!monaco || !monaco.editor) return;

      monaco.editor.defineTheme('custom-dark', DARK_THEME);

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        jsx: monaco.languages.typescript.JsxEmit.React,
        lib: ['es2020', 'dom'],
        strict: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      });

      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        jsx: monaco.languages.typescript.JsxEmit.React,
        lib: ['es2020', 'dom'],
        allowJs: true,
        checkJs: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      });

      if (theme === 'dark') {
        monaco.editor.setTheme('custom-dark');
      }
    },
    [theme],
  );

  return {
    currentTheme: theme === 'light' ? 'light' : 'custom-dark',
    setupEditorTheme,
  };
}
