import React, { useState, useRef, useEffect } from 'react';
import styles from './TextEditor.module.css';

interface TextEditorProps {
  content?: string;
  onSave?: (content: string) => void;
  placeholder?: string;
  title?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  content = '', 
  onSave, 
  placeholder = 'Start typing...',
  title = 'Document'
}) => {
  const [text, setText] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Set initial content when component mounts or content prop changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.textContent = content;
    }
  }, [content]);

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    setText(newText);
    
    if (onSave) {
      // Debounced save
      clearTimeout((window as any).saveTimeout);
      (window as any).saveTimeout = setTimeout(() => {
        onSave(newText);
      }, 1000);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button className={styles.toolButton} title="Bold">
            <strong>B</strong>
          </button>
          <button className={styles.toolButton} title="Italic">
            <em>I</em>
          </button>
          <button className={styles.toolButton} title="Underline">
            <u>U</u>
          </button>
        </div>
        
        <div className={styles.toolGroup}>
          <select className={styles.toolSelect} defaultValue="16">
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
          </select>
        </div>

        <div className={styles.toolGroup}>
          <button className={styles.toolButton} title="Align Left">⫷</button>
          <button className={styles.toolButton} title="Align Center">⫸</button>
          <button className={styles.toolButton} title="Align Right">⫹</button>
        </div>

        <div className={styles.toolGroup}>
          <button className={styles.toolButton} title="Bullet List">•</button>
          <button className={styles.toolButton} title="Numbered List">1.</button>
        </div>
      </div>

      {/* Editor Area */}
      <div className={styles.editorArea}>
        <div className={styles.documentContainer}>
          <div className={styles.document}>
            <div
              ref={editorRef}
              className={`${styles.editor} ${isEditing ? styles.editing : ''}`}
              contentEditable
              onInput={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              suppressContentEditableWarning={true}
              data-placeholder={placeholder}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor; 