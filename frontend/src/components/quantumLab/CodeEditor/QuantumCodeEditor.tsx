import { useRef, useEffect } from 'react'
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditorType } from 'monaco-editor'

interface QuantumCodeEditorProps {
  code: string
  onChange: (value: string) => void
  highlightedLine?: number
  onLineCursorChange?: (lineNumber: number) => void
}

export function QuantumCodeEditor({
  code,
  onChange,
  highlightedLine,
  onLineCursorChange,
}: QuantumCodeEditorProps) {
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const decorationsRef = useRef<MonacoEditorType.IEditorDecorationsCollection | null>(null)

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('qubera-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '10201c', background: 'f8f7f2' },
        { token: 'keyword', foreground: '0b3d32', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: '0b3d32', fontStyle: 'bold' },
        { token: 'keyword.operator', foreground: '2f6b57' },
        { token: 'function', foreground: '2f6b57', fontStyle: 'semibold' },
        { token: 'identifier', foreground: '10201c' },
        { token: 'string', foreground: '9a7b3f' },
        { token: 'string.escape', foreground: '856a35' },
        { token: 'number', foreground: '9a7b3f' },
        { token: 'comment', foreground: '6d927d', fontStyle: 'italic' },
        { token: 'delimiter', foreground: '4a4e46' },
      ],
      colors: {
        'editor.background': '#f8f7f2',
        'editor.foreground': '#10201c',
        'editorLineNumber.foreground': '#9dbdad',
        'editorLineNumber.activeForeground': '#0b3d32',
        'editor.lineHighlightBackground': '#eef4ef',
        'editor.selectionBackground': '#dce8de',
        'editor.inactiveSelectionBackground': '#e6efe9',
        'editorCursor.foreground': '#0b3d32',
        'editorIndentGuide.background': '#ddd9cd',
        'editorIndentGuide.activeBackground': '#bfd5cc',
        'editorGutter.background': '#f8f7f2',
      },
    })
  }

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidChangeCursorPosition((e) => {
      onLineCursorChange?.(e.position.lineNumber)
    })

    decorationsRef.current = editor.createDecorationsCollection([])
  }

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !decorationsRef.current) return

    if (highlightedLine && highlightedLine > 0) {
      decorationsRef.current.set([
        {
          range: new monacoRef.current.Range(highlightedLine, 1, highlightedLine, 1),
          options: {
            isWholeLine: true,
            className: 'qlab-code-line-highlight',
          },
        },
      ])

      editorRef.current.revealLineInCenterIfOutsideViewport(highlightedLine)
    } else {
      decorationsRef.current.clear()
    }
  }, [highlightedLine])

  return (
    <div className="qlab-monaco-wrapper">
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="qubera-light"
        value={code}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        onChange={(val) => onChange(val || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', Consolas, Menlo, monospace",
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          renderLineHighlight: 'all',
          tabSize: 4,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
        }}
      />
    </div>
  )
}
