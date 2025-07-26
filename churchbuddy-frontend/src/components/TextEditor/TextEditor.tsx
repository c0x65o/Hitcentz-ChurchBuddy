import React, { useState, useRef, useEffect } from 'react';
import styles from './TextEditor.module.css';

interface TextEditorProps {
  content?: string;
  onSave?: (content: string) => void;
  placeholder?: string;
  title?: string;
  storageKey?: string; // New prop for localStorage key
  onMakeSlide?: (selectedText: string) => Promise<any>; // New prop for sermon slide creation
  showMakeSlideButton?: boolean; // New prop to show/hide Make Slide button
  onClearSlides?: () => void; // New prop for clearing slides
  showClearSlidesButton?: boolean; // New prop to show/hide Clear Slides button
  onPreachMode?: () => void; // New prop for preach mode
  showPreachButton?: boolean; // New prop to show/hide Preach button
  isPreachMode?: boolean; // New prop to track preach mode state
  onSlideButtonClick?: (slideId: string) => void; // New prop for slide button clicks
  activeSlideId?: string; // New prop to track which slide is currently active
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  content = '', 
  onSave, 
  placeholder = 'Start typing...',
  title = 'Document',
  storageKey = 'text-editor-content', // Default key
  onMakeSlide,
  showMakeSlideButton = false,
  onClearSlides,
  showClearSlidesButton = false,
  onPreachMode,
  showPreachButton = false,
  isPreachMode = false,
  onSlideButtonClick,
  activeSlideId,
}) => {
  const [text, setText] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Effect for event delegation: handle clicks on slide buttons
  useEffect(() => {
    const editorElement = editorRef.current;
    if (!editorElement) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element or any of its parents is a slide-button
      const slideButton = target.closest('.slide-button') as HTMLElement;

      if (slideButton && isPreachMode) {
        e.preventDefault(); // Prevent any default contentEditable behavior
        const slideId = slideButton.getAttribute('data-slide-id');
        console.log('Event delegated: Slide button clicked!', slideId);
        if (slideId && onSlideButtonClick) {
          console.log('Calling onSlideButtonClick from event delegation for:', slideId);
          onSlideButtonClick(slideId);
        }
      }
    };

    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [onSlideButtonClick, isPreachMode]); // Re-run if these props change

  // Effect to update slide button styling when activeSlideId or preach mode changes
  useEffect(() => {
    if (!editorRef.current) return;

    const slideButtons = editorRef.current.querySelectorAll('.slide-button');
    slideButtons.forEach(button => {
      const slideId = button.getAttribute('data-slide-id');
      const element = button as HTMLElement;

      if (slideId === activeSlideId && isPreachMode) {
        // Apply active styles
        element.style.background = 'rgba(0, 123, 255, 0.2)';
        element.style.color = '#007bff';
        element.style.fontWeight = '600';
        element.style.borderColor = 'rgba(0, 123, 255, 0.5)';
        element.style.boxShadow = '0 2px 4px rgba(0, 123, 255, 0.3)';
      } else {
        // Apply inactive (default) styles
        element.style.background = 'rgba(102, 126, 234, 0.1)';
        element.style.color = '#667eea';
        element.style.fontWeight = '500';
        element.style.borderColor = 'rgba(102, 126, 234, 0.3)';
        element.style.boxShadow = 'none';
      }
    });
  }, [activeSlideId, isPreachMode]);

  // Load content from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem(storageKey);
    if (editorRef.current) {
      if (savedContent) {
        // Prioritize localStorage content
        editorRef.current.innerHTML = savedContent;
        setText(savedContent);
      } else if (content) {
        // Only use content prop if no localStorage content exists
        editorRef.current.innerHTML = content;
        setText(content);
      }
    }
  }, [content, storageKey]);

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerHTML || '';
    setText(newText);
    
    // Save to localStorage
    localStorage.setItem(storageKey, newText);
    
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
    
    // Handle Enter key to add new lines naturally
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak', false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Let the default paste happen first
    setTimeout(() => {
      // Then trigger save immediately after paste
      if (onSave && editorRef.current) {
        const newText = editorRef.current.innerHTML || '';
        console.log('Paste detected, triggering immediate save');
        onSave(newText);
      }
    }, 100);
  };

  const handleMakeSlide = async () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      console.log('Creating slide from selected text:', selectedText);
      
      if (onMakeSlide) {
        try {
          const slideInfo = await onMakeSlide(selectedText);
          if (slideInfo && editorRef.current) {
            // Replace the selected text with a slide button
            const range = selection.getRangeAt(0);
            const slideButton = createSlideButton(slideInfo);
            
            // Clear the selection and insert the button
            range.deleteContents();
            range.insertNode(slideButton);
            
            // Update the editor content
            const newContent = editorRef.current.innerHTML;
            setText(newContent);
            localStorage.setItem(storageKey, newContent);
            
            // Trigger save
            if (onSave) {
              onSave(newContent);
            }
            
            console.log('Slide button created and inserted');
          }
        } catch (error) {
          console.error('Failed to create slide:', error);
          alert('Failed to create slide. Please try again.');
        }
      }
    } else {
      alert('Please select some text first to create a slide.');
    }
  };

  const createSlideButton = (slideInfo: any) => {
    const button = document.createElement('span');
    button.className = 'slide-button';
    button.setAttribute('data-slide-id', slideInfo.slideId);
    button.setAttribute('data-slide-title', slideInfo.slideTitle);
    button.setAttribute('data-original-text', slideInfo.originalText);
    
    // Get current editor font size to match slide button
    const currentFontSize = editorRef.current?.style.fontSize || '16px';
    
    // Check if this slide is currently active
    const isActive = slideInfo.slideId === activeSlideId;
    
    button.style.cssText = `
      display: inline-block;
      background: ${isActive ? 'rgba(0, 123, 255, 0.2)' : 'rgba(102, 126, 234, 0.1)'};
      color: ${isActive ? '#007bff' : '#667eea'};
      padding: 4px 8px;
      margin: 1px 2px;
      border-radius: 4px;
      font-size: ${currentFontSize};
      font-weight: ${isActive ? '600' : '500'};
      cursor: pointer;
      border: 1px solid ${isActive ? 'rgba(0, 123, 255, 0.5)' : 'rgba(102, 126, 234, 0.3)'};
      box-shadow: ${isActive ? '0 2px 4px rgba(0, 123, 255, 0.3)' : 'none'};
      user-select: none;
      transition: all 0.2s ease;
      line-height: 1.4;
      max-width: 100%;
      word-wrap: break-word;
      font-family: inherit;
      pointer-events: all; /* Ensure button receives click events */
    `;
    // Use the original highlighted text as the button text
    button.innerHTML = slideInfo.originalText;
    
    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.background = isActive ? 'rgba(0, 123, 255, 0.25)' : 'rgba(102, 126, 234, 0.15)';
      button.style.borderColor = isActive ? 'rgba(0, 123, 255, 0.6)' : 'rgba(102, 126, 234, 0.5)';
      button.style.boxShadow = isActive ? '0 3px 6px rgba(0, 123, 255, 0.4)' : '0 1px 3px rgba(102, 126, 234, 0.2)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = isActive ? 'rgba(0, 123, 255, 0.2)' : 'rgba(102, 126, 234, 0.1)';
      button.style.borderColor = isActive ? 'rgba(0, 123, 255, 0.5)' : 'rgba(102, 126, 234, 0.3)';
      button.style.boxShadow = isActive ? '0 2px 4px rgba(0, 123, 255, 0.3)' : 'none';
    });
    
    return button;
  };

  // Font toolbar functions
  const handleFontSize = (size: string) => {
    if (editorRef.current) {
      // Apply font size to the entire editor content
      const fontSize = size === '1' ? '12px' : 
                     size === '3' ? '16px' : 
                     size === '5' ? '20px' : 
                     size === '7' ? '24px' : '16px';
      
      editorRef.current.style.fontSize = fontSize;
      
      // Update slide button font sizes to match
      const slideButtons = editorRef.current.querySelectorAll('.slide-button');
      slideButtons.forEach(button => {
        (button as HTMLElement).style.fontSize = fontSize;
      });
      
      // Also update any existing content
      const currentContent = editorRef.current.innerHTML;
      if (currentContent) {
        // Re-apply the content to ensure the new font size takes effect
        editorRef.current.innerHTML = currentContent;
      }
    }
  };

  const handleBold = () => {
    document.execCommand('bold', false);
  };

  const handleItalic = () => {
    document.execCommand('italic', false);
  };

  const handleHighlight = () => {
    document.execCommand('backColor', false, 'yellow');
  };

  return (
    <div className={`${styles.container} ${isPreachMode ? styles.preachMode : ''}`}>
      {/* Toolbar */}
      <div className={`${styles.toolbar} ${isPreachMode ? styles.preachMode : ''}`}>
        <div className={styles.toolbarLeft}>
          {showClearSlidesButton && !isPreachMode && (
            <button 
              className={styles.toolbarButton}
              onClick={onClearSlides}
              title="Clear all slides and slide buttons"
            >
              🗑️ Clear Slides
            </button>
          )}
          {showMakeSlideButton && !isPreachMode && (
            <button 
              className={styles.toolbarButton}
              onClick={handleMakeSlide}
              title="Create slide from selected text"
            >
              📄 Make Slide
            </button>
          )}
        </div>
        
        <div className={styles.toolbarRight}>
          {isPreachMode && (
            <div className={styles.preachModeMessage}>
              📝 Press buttons to set slides as active
            </div>
          )}
          
          {showPreachButton && (
            <button 
              className={styles.toolbarButton}
              onClick={onPreachMode}
              title={isPreachMode ? "Return to edit mode" : "Switch to presentation mode"}
            >
              {isPreachMode ? "✏️ Edit" : "📖 Preach"}
            </button>
          )}
          
          {!isPreachMode && (
            <>
              <select 
                className={styles.toolSelect}
                onChange={(e) => handleFontSize(e.target.value)}
                defaultValue="3"
                title="Font Size"
              >
                <option value="1">Small</option>
                <option value="3">Normal</option>
                <option value="5">Large</option>
                <option value="7">Extra Large</option>
              </select>
              
              <button 
                className={styles.toolButton}
                onClick={handleBold}
                title="Bold"
              >
                <strong>B</strong>
              </button>
              
              <button 
                className={styles.toolButton}
                onClick={handleItalic}
                title="Italic"
              >
                <em>I</em>
              </button>
              
              <button 
                className={styles.toolButton}
                onClick={handleHighlight}
                title="Highlight"
              >
                🟡
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className={styles.editorArea}>
        <div className={styles.documentContainer}>
          <div className={styles.document}>
            <div
              ref={editorRef}
              className={`${styles.editor} ${isEditing ? styles.editing : ''}`}
              contentEditable={true} // Always contentEditable, control interaction via handlers
              onInput={isPreachMode ? undefined : handleTextChange}
              onFocus={isPreachMode ? undefined : handleFocus}
              onBlur={isPreachMode ? undefined : handleBlur}
              onKeyDown={isPreachMode ? undefined : handleKeyDown}
              onPaste={isPreachMode ? undefined : handlePaste}
              suppressContentEditableWarning={true}
              data-placeholder={placeholder}
              key={storageKey} // Force re-render when storageKey changes
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor; 