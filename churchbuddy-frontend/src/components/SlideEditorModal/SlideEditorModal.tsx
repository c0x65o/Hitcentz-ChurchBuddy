import React from 'react';
import styles from './SlideEditorModal.module.css';
import { ISlide } from '../../types/ISlide';
import SlideRenderer from '../SlideRenderer/SlideRenderer';

interface SlideEditorModalProps {
  slide: ISlide;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSlide: ISlide, shouldCloseModal?: boolean) => void;
}

const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  slide,
  isOpen,
  onClose,
  onSave
}) => {
  const [currentSlideHtml, setCurrentSlideHtml] = React.useState(slide.html);
  const [saveAttempts, setSaveAttempts] = React.useState(0);

  // Update HTML when slide changes
  React.useEffect(() => {
    console.log('=== MODAL OPENED - LOADING SLIDE HTML ===');
    console.log('Original slide HTML:', slide.html);
    
    // Clean any existing handles or duplicates from the loaded HTML
    let cleanInitialHtml = slide.html;
    cleanInitialHtml = cleanInitialHtml.replace(/<div[^>]*data-handle-[^>]*>.*?<\/div>/gi, '');
    cleanInitialHtml = cleanInitialHtml.replace(/<div[^>]*style="[^"]*position:\s*absolute[^"]*"[^>]*>.*?<\/div>/gi, '');
    
    // Remove duplicate elements with the same ID from initial load
    const elementIds = new Set();
    cleanInitialHtml = cleanInitialHtml.replace(/<(h[1-6]|p|div)[^>]*id="([^"]+)"[^>]*>.*?<\/\1>/gi, (match, tag, id) => {
      if (elementIds.has(id)) {
        console.log('Removing duplicate element from initial HTML, ID:', id);
        return ''; // Remove duplicate
      }
      elementIds.add(id);
      return match; // Keep first occurrence
    });
    
    console.log('Cleaned initial HTML:', cleanInitialHtml);
    setCurrentSlideHtml(cleanInitialHtml);
  }, [slide.html]);

  // Auto-save all changes before modal closes
  const handleClose = () => {
    console.log('Modal closing - auto-saving all changes');
    
    // First, PERMANENTLY clean up all handles to prevent them from being saved
    const allHandles = document.querySelectorAll('[data-handle-name], [data-handle-type]');
    const allHandlesByElementId = document.querySelectorAll('[data-element-id]');
    console.log('Cleaning up', allHandles.length + allHandlesByElementId.length, 'handles before save');
    
    // Remove all handle elements
    allHandles.forEach(handle => {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle);
      }
    });
    allHandlesByElementId.forEach(handle => {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle);
      }
    });
    
    // Additional cleanup: remove any leftover elements that look like handles
    const possibleHandles = document.querySelectorAll('div[style*="position: absolute"]');
    possibleHandles.forEach(element => {
      const style = (element as HTMLElement).style;
      const hasHandleCharacteristics = (
        (style.width === '12px' && style.height === '12px') || // Corner handles
        (style.width === '36px' && style.height === '36px') || // Drag/rotate handles
        (style.width === '8px') || // Edge handles
        (style.height === '8px') ||
        style.cursor?.includes('resize') ||
        style.cursor === 'move' ||
        style.cursor === 'pointer'
      );
      
      if (hasHandleCharacteristics && element.parentNode) {
        console.log('Removing leftover handle-like element:', element);
        element.parentNode.removeChild(element);
      }
    });
    
    // Capture all current element states and save them
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    if (slideContent) {
      const textElements = slideContent.querySelectorAll('h1, h2, h3, p, div');
      textElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        // Force save current state of each element
        const currentText = htmlEl.textContent?.replace(/[⋮⠿↻🔄✋]/g, '').trim() || '';
        handleTextEdit(htmlEl, currentText);
      });
    }
    
    // Small delay to ensure all saves complete, then close
    setTimeout(() => {
      console.log('Auto-save complete, closing modal');
      onClose();
    }, 200);
  };

  // Debug modal lifecycle and catch crashes
  React.useEffect(() => {
    console.log('=== MODAL LIFECYCLE ===');
    console.log('Modal isOpen changed to:', isOpen);
    console.log('Current slide:', slide.id, slide.title);
    console.log('Current HTML length:', slide.html.length);
    
    if (isOpen) {
      console.log('Modal opened - setting up error handlers');
      

      
      // Add global error handler for unhandled errors
      const handleGlobalError = (event: ErrorEvent) => {
        console.error('=== GLOBAL ERROR DETECTED (MIGHT CRASH MODAL) ===');
        console.error('Message:', event.message);
        console.error('Filename:', event.filename);
        console.error('Line:', event.lineno, 'Column:', event.colno);
        console.error('Error object:', event.error);
        console.error('Modal will likely close now!');
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        console.error('=== UNHANDLED PROMISE REJECTION (MIGHT CRASH MODAL) ===');
        console.error('Reason:', event.reason);
        console.error('Promise:', event.promise);
        console.error('Modal will likely close now!');
      };

      window.addEventListener('error', handleGlobalError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      // Monitor if modal gets unmounted unexpectedly
      const checkInterval = setInterval(() => {
        if (!document.querySelector('[class*="SlideEditorModal"]')) {
          console.error('=== MODAL DISAPPEARED FROM DOM ===');
          console.error('Modal was unmounted unexpectedly!');
          clearInterval(checkInterval);
        }
      }, 1000);

      return () => {
        console.log('Modal cleanup - removing error handlers');
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        clearInterval(checkInterval);
      };
    } else {
      console.log('Modal closed normally');
    }
  }, [isOpen, slide.id]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Backdrop click disabled - only close button can close modal
    console.log('Backdrop clicked - ignoring (backdrop close disabled)');
  };



  const handleTextEdit = (element: HTMLElement, newText: string) => {
    // === TEXT EDIT START === (logs preserved)
    console.log('=== TEXT EDIT START ===');
    console.log('Text edited:', newText);
    console.log('Element:', element.tagName);
    console.log('Modal isOpen:', isOpen);
    
    // Ensure no handles are in DOM (debug)
    const existingHandles = document.querySelectorAll('[data-handle-name], [data-handle-type]');
    console.log('Found', existingHandles.length, 'handles during text edit - should be 0 for clean save');

    try {
      // Capture styles (existing logic unchanged)
      const transform = element.style.transform;
      const width = element.style.width;
      const height = element.style.height;
      const fontSize = element.style.fontSize;
      const minWidth = element.style.minWidth;
      const maxWidth = element.style.maxWidth;
      const minHeight = element.style.minHeight;
      const maxHeight = element.style.maxHeight;
      
      let styleAttr = '';
      const styles = [];
      
      if (transform && (transform.includes('translate') || transform.includes('rotate'))) {
        styles.push(`transform: ${transform}`);
        styles.push('position: relative');
        console.log('Preserving transform:', transform);
      }
      
      if (width && width !== 'auto' && width !== '') {
        styles.push(`width: ${width}`);
        console.log('Preserving width:', width);
      }
      
      if (height && height !== 'auto' && height !== '') {
        styles.push(`height: ${height}`);
        console.log('Preserving height:', height);
      }
      
      if (fontSize && fontSize !== '') {
        styles.push(`font-size: ${fontSize}`);
        console.log('Preserving font-size:', fontSize);
      }
      
      // Add min/max constraints if they exist
      if (minWidth && minWidth !== '') styles.push(`min-width: ${minWidth}`);
      if (maxWidth && maxWidth !== 'none' && maxWidth !== '') styles.push(`max-width: ${maxWidth}`);
      if (minHeight && minHeight !== '') styles.push(`min-height: ${minHeight}`);
      if (maxHeight && maxHeight !== 'none' && maxHeight !== '') styles.push(`max-height: ${maxHeight}`);
      
      if (styles.length > 0) {
        styleAttr = ` style="${styles.join('; ')}"`;
        console.log('Complete style attribute:', styleAttr);
      }
    
    // === NEW ID AND REPLACEMENT LOGIC ===
    const tagName = element.tagName.toLowerCase();
    const elementId = element.id || `text-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    element.id = elementId; // Ensure element has ID in DOM
    const idAttr = ` id="${elementId}"`;

    let styleAttribute = styleAttr ? styleAttr : '';
    if (!styleAttribute.startsWith(' style')) styleAttribute = ` ${styleAttribute.trim()}`;

    const replacement = `<${tagName}${idAttr}${styleAttribute}>${newText}</${tagName}>`;

    let updatedHtml = currentSlideHtml;
    const idRegex = new RegExp(`<${tagName}[^>]*id="${elementId}"[^>]*>[\s\S]*?<\/${tagName}>`, 'i');

    if (idRegex.test(updatedHtml)) {
      console.log('Replacing element by ID');
      updatedHtml = updatedHtml.replace(idRegex, replacement);
    } else {
      console.warn('ID-based replacement failed. Falling back to text-based search');
      const safeText = newText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const textRegex = new RegExp(`<${tagName}[^>]*>${safeText}<\/${tagName}>`, 'i');
      updatedHtml = updatedHtml.replace(textRegex, replacement);
    }

    // === REMOVE DUPLICATES WITH SAME TEXT CONTENT ===
    const safeNewText = newText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const duplicateRegex = new RegExp(`<${tagName}[^>]*>\\s*${safeNewText}\\s*<\\/${tagName}>`, 'gi');
    
    // Count occurrences
    let match;
    let count = 0;
    const tempRegex = new RegExp(duplicateRegex.source, 'gi');
    while ((match = tempRegex.exec(updatedHtml)) !== null) {
      count++;
      if (count > 10) break; // Safety limit
    }
    
    if (count > 1) {
      console.log('Removing', count - 1, 'duplicate elements of same text');
      // Keep first occurrence, remove rest
      let first = true;
      updatedHtml = updatedHtml.replace(duplicateRegex, (match) => {
        if (first) { 
          first = false; 
          return match; 
        }
        return '';
      });
    }

    // === CLEAN HANDLES (existing logic moved here) ===
    let cleanHtml = updatedHtml
      .replace(/<div[^>]*data-handle-[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*data-element-id[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*style="[^"]*cursor:[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*style="[^"]*position:\s*absolute[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

    // Remove duplicate IDs (safety)
    const ids = new Set<string>();
    cleanHtml = cleanHtml.replace(/<(h[1-6]|p|div)[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/\1>/gi, (m, tg, id) => {
      if (ids.has(id)) return '';
      ids.add(id); return m;
    });

    // Update state and trigger save if changed
    if (cleanHtml !== currentSlideHtml) {
      setSaveAttempts(prev => prev + 1);
      console.log('Updating slide HTML (attempt #' + (saveAttempts + 1) + ')');
      setCurrentSlideHtml(cleanHtml);
      
      // Auto-save after a delay
      setTimeout(() => {
        try {
          console.log('Auto-saving slide changes');
          const updatedSlide = {
            ...slide,
            html: cleanHtml,
            updatedAt: new Date()
          };
          onSave(updatedSlide, false); // Don't close modal for auto-save
          console.log('Auto-save completed successfully');
        } catch (saveError) {
          console.error('=== ERROR DURING AUTO-SAVE (MIGHT CRASH MODAL) ===');
          console.error('Save error:', saveError);
        }
      }, 500); // Faster auto-save
    } else {
      console.log('HTML did not change - no update needed (attempt #' + (saveAttempts + 1) + ')');
      console.log('Current HTML:', currentSlideHtml);
      console.log('Expected HTML:', cleanHtml);
    }
    
    console.log('=== TEXT EDIT COMPLETE ===');
  } catch (err) {
    console.error('=== ERROR DURING TEXT EDIT ===', err);
  }
};

// Add new text box function
const handleAddTextBox = () => {
  console.log('=== ADDING NEW TEXT BOX ===');
  
  try {
    // Create a new text element with default text "TEXT"
    const newTextElement = document.createElement('h2');
    newTextElement.textContent = 'TEXT';
    newTextElement.id = `text-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Style the new element to be centered
    newTextElement.style.position = 'absolute';
    newTextElement.style.left = '50%';
    newTextElement.style.top = '50%';
    newTextElement.style.transform = 'translate(-50%, -50%)';
    newTextElement.style.color = '#ffffff';
    newTextElement.style.fontSize = '48px';
    newTextElement.style.fontWeight = 'bold';
    newTextElement.style.textAlign = 'center';
    newTextElement.style.cursor = 'pointer';
    newTextElement.style.userSelect = 'none';
    newTextElement.style.zIndex = '10';
    
    // Add the element to the slide content - target the modal-specific one
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    console.log('Found modal slide content:', slideContent);
    
    if (slideContent) {
      // First, update the HTML state to include the new element
      const newElementHtml = newTextElement.outerHTML;
      const updatedHtml = currentSlideHtml + newElementHtml;
      
      console.log('Adding new element to HTML:', newElementHtml);
      console.log('Updated HTML length:', updatedHtml.length);
      
      // Update the state - this will cause React to re-render
      setCurrentSlideHtml(updatedHtml);
      
      // Wait for React to re-render, then find and click the new element
      setTimeout(() => {
        const renderedElement = slideContent.querySelector(`#${newTextElement.id}`);
        if (renderedElement) {
          (renderedElement as HTMLElement).click();
          console.log('Triggered click on newly rendered text element');
        } else {
          console.error('Could not find newly rendered element with ID:', newTextElement.id);
          // Fallback: try to find by text content
          const fallbackElement = slideContent.querySelector('h2');
          if (fallbackElement && fallbackElement.textContent === 'TEXT') {
            (fallbackElement as HTMLElement).click();
            console.log('Used fallback click method');
          }
        }
      }, 300); // Longer delay to ensure React has time to re-render
      
    } else {
      console.error('Could not find slide content container');
    }
    
  } catch (error) {
    console.error('Error adding new text box:', error);
  }
};

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        {/* Close Button */}
        <button 
          className={styles.closeButton}
          onClick={handleClose}
          title="Close Editor"
        >
          ×
        </button>



        {/* Toolbar */}
        <div className={styles.toolbar}>
          {/* Text Tools */}
          <div className={styles.toolGroup}>
            <span className={styles.groupLabel}>Text</span>
            <button 
              className={styles.toolButton} 
              title="Add Text Box" 
              onClick={handleAddTextBox}
            >
              T+
            </button>
            <select className={styles.toolSelect} title="Font Family">
              <option>Arial</option>
              <option>Times</option>
              <option>Helvetica</option>
            </select>
            <input 
              type="number" 
              className={styles.toolInput} 
              placeholder="24" 
              title="Font Size"
              min="8"
              max="200"
            />
            <input 
              type="color" 
              className={styles.colorPicker} 
              defaultValue="#ffffff"
              title="Text Color"
            />
            <button className={styles.toolButton} title="Bold">
              <strong>B</strong>
            </button>
            <button className={styles.toolButton} title="Italic">
              <em>I</em>
            </button>
          </div>

          {/* Media Tools */}
          <div className={styles.toolGroup}>
            <span className={styles.groupLabel}>Media</span>
            <button className={styles.toolButton} title="Add Image">
              🖼️
            </button>
            <button className={styles.toolButton} title="Add YouTube Video">
              📹
            </button>
            <button className={styles.toolButton} title="Rotate Image">
              🔄
            </button>
          </div>

          {/* Element Tools */}
          <div className={styles.toolGroup}>
            <span className={styles.groupLabel}>Element</span>
            <button 
              className={styles.toolButton} 
              title="Save Positions"
              onClick={() => {
                // Force save all current positions
                const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
                if (slideContent) {
                  const textElements = slideContent.querySelectorAll('h1, h2, h3, p, div');
                  textElements.forEach((el) => {
                    const htmlEl = el as HTMLElement;
                                         if (htmlEl.style.transform) {
                       // Trigger save with current text and position (auto-save, don't close modal)
                       handleTextEdit(htmlEl, htmlEl.textContent?.replace(/⋮⋮/g, '').trim() || '');
                     }
                  });
                }
              }}
            >
              💾
            </button>
            <button 
              className={styles.toolButton} 
              title="Reset Position"
              onClick={() => {
                // Reset all text element positions
                const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
                if (slideContent) {
                  const textElements = slideContent.querySelectorAll('h1, h2, h3, p, div');
                  textElements.forEach((el) => {
                    (el as HTMLElement).style.transform = '';
                  });
                }
              }}
            >
              🎯
            </button>
            <button className={styles.toolButton} title="Delete Selected">
              🗑️
            </button>
            <button className={styles.toolButton} title="Duplicate Selected">
              📋
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className={styles.content}>
          {/* SlideRenderer for editing */}
          <div className={styles.editorArea}>
            <div className={styles.slideWrapper}>
              <SlideRenderer 
                slide={{...slide, html: currentSlideHtml}} 
                editMode={true}
                onTextEdit={handleTextEdit}
                uniqueId="modal-editor"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditorModal; 