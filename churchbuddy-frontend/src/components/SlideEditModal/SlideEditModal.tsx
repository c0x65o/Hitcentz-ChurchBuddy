import React, { useState, useEffect, useRef } from 'react';
import { ISlide } from '../../types/ISlide';
import SlideRenderer from '../SlideRenderer/SlideRenderer';
import styles from './SlideEditModal.module.css';

interface SlideEditModalProps {
  slide: ISlide;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedSlide: ISlide) => void;
}

interface EditableTextElement {
  id: string;
  content: string;
  style: {
    fontFamily: string;
    fontSize: string;
    color: string;
    textAlign: string;
    fontWeight: string;
    fontStyle: string;
  };
  position: {
    left: string;
    top: string;
    transform: string;
    zIndex: number;
  };
}

const SlideEditModal: React.FC<SlideEditModalProps> = ({
  slide,
  isOpen,
  onClose,
  onSave
}) => {
  const [currentSlide, setCurrentSlide] = useState<ISlide | null>(null);
  const [textElements, setTextElements] = useState<EditableTextElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });

  const slideContainerRef = useRef<HTMLDivElement>(null);
  const slideRendererRef = useRef<HTMLDivElement>(null);

  // Initialize slide and parse text elements
  useEffect(() => {
    if (!isOpen || !slide) return;
    
    setCurrentSlide(slide);
    
    // Parse existing slide HTML to extract text elements
    const parseSlideHTML = () => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = slide.html;
      
      const elements: EditableTextElement[] = [];
      let elementIndex = 0;
      
      // Find all text elements with absolute positioning
      const textElements = tempDiv.querySelectorAll('[style*="position: absolute"]');
      
      if (textElements.length > 0) {
        // Parse existing positioned elements
        textElements.forEach((element) => {
          const style = element.getAttribute('style') || '';
          const leftMatch = style.match(/left:\s*([^;]+)/);
          const topMatch = style.match(/top:\s*([^;]+)/);
          const fontSizeMatch = style.match(/font-size:\s*([^;]+)/);
          const colorMatch = style.match(/color:\s*([^;]+)/);
          const textAlignMatch = style.match(/text-align:\s*([^;]+)/);
          
          elements.push({
            id: `text-${elementIndex}`,
            content: element.textContent || '',
            style: {
              fontFamily: 'Arial, sans-serif',
              fontSize: fontSizeMatch ? fontSizeMatch[1] : '40px',
              color: colorMatch ? colorMatch[1] : '#ffffff',
              textAlign: textAlignMatch ? textAlignMatch[1] : 'center',
              fontWeight: 'normal',
              fontStyle: 'normal'
            },
            position: {
              left: leftMatch ? leftMatch[1] : '50%',
              top: topMatch ? topMatch[1] : '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: elementIndex
            }
          });
          elementIndex++;
        });
      } else {
        // Create default centered element
        const textContent = slide.html.replace(/<[^>]*>/g, '').trim() || 'Sample Text';
        elements.push({
          id: 'text-0',
          content: textContent,
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: '40px',
            color: '#ffffff',
            textAlign: 'center',
            fontWeight: 'normal',
            fontStyle: 'normal'
          },
          position: {
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0
          }
        });
      }
      
      setTextElements(elements);
    };
    
    parseSlideHTML();
  }, [slide, isOpen]);

  // Handle mouse down (start drag)
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (e.detail === 2) return; // Ignore if double-click
    
    setIsDragging(true);
    setSelectedElementId(elementId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = slideContainerRef.current!.getBoundingClientRect();
    
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPosition({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top
    });
    
    e.preventDefault();
  };

  // Handle mouse move (drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedElementId) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newX = initialPosition.x + deltaX;
      const newY = initialPosition.y + deltaY;
      
      // Update the DOM element directly (bypass React state during drag)
      const element = document.getElementById(`text-element-${selectedElementId}`);
      if (element) {
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
        element.style.transform = 'none';
      }
    };

    const handleMouseUp = () => {
      if (isDragging && selectedElementId) {
        // Update React state after drag ends
        const element = document.getElementById(`text-element-${selectedElementId}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const containerRect = slideContainerRef.current!.getBoundingClientRect();
          
          const newLeft = rect.left - containerRect.left;
          const newTop = rect.top - containerRect.top;
          
          setTextElements(prev => prev.map(el =>
            el.id === selectedElementId
              ? {
                  ...el,
                  position: {
                    ...el.position,
                    left: `${newLeft}px`,
                    top: `${newTop}px`,
                    transform: 'none'
                  }
                }
              : el
          ));
        }
        
        setIsDragging(false);
        setSelectedElementId(null);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedElementId, dragStart, initialPosition]);

  // Handle text input (real-time updates)
  const handleTextInput = (elementId: string, newContent: string) => {
    setTextElements(prev => prev.map(el =>
      el.id === elementId
        ? { ...el, content: newContent }
        : el
    ));
  };

  // Handle style changes
  const handleStyleChange = (elementId: string, property: string, value: string) => {
    setTextElements(prev => prev.map(el =>
      el.id === elementId
        ? {
            ...el,
            style: {
              ...el.style,
              [property]: value
            }
          }
        : el
    ));
  };

  // Convert text elements back to HTML
  const convertToHTML = (): string => {
    if (textElements.length === 0) return slide.html;
    
    let html = '';
    textElements.forEach(element => {
      const styleString = `
        position: absolute;
        left: ${element.position.left};
        top: ${element.position.top};
        transform: ${element.position.transform};
        z-index: ${element.position.zIndex};
        font-family: ${element.style.fontFamily};
        font-size: ${element.style.fontSize};
        color: ${element.style.color};
        text-align: ${element.style.textAlign};
        font-weight: ${element.style.fontWeight};
        font-style: ${element.style.fontStyle};
        cursor: move;
        user-select: none;
      `;
      
      html += `<div style="${styleString}">${element.content}</div>`;
    });
    
    return html;
  };

  // Handle save
  const handleSave = () => {
    if (!currentSlide) return;
    
    const updatedSlide = {
      ...currentSlide,
      html: convertToHTML()
    };
    
    setCurrentSlide(updatedSlide);
    onSave?.(updatedSlide);
    onClose();
  };

  // Handle add text
  const handleAddText = () => {
    const newElement: EditableTextElement = {
      id: `text-${textElements.length}`,
      content: 'New Text',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '40px',
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: 'normal',
        fontStyle: 'normal'
      },
      position: {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: textElements.length
      }
    };
    
    setTextElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  if (!isOpen || !currentSlide) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Edit Slide</h2>
          <div className={styles.headerButtons}>
            <button onClick={handleAddText} className={styles.addTextButton}>
              + Add Text
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              Cancel
            </button>
            <button onClick={handleSave} className={styles.saveButton}>
              Save
            </button>
          </div>
        </div>
        
        <div className={styles.editorContainer}>
          {/* Slide container with background */}
          <div ref={slideContainerRef} className={styles.slideContainer}>
            {/* Background slide */}
            <div className={styles.backgroundSlide}>
              <SlideRenderer 
                slide={currentSlide} 
                className={styles.backgroundRenderer}
                isActive={false}
              />
            </div>
            
            {/* Editable text elements */}
            {textElements.map(element => (
              <div
                key={element.id}
                id={`text-element-${element.id}`}
                className={`${styles.textElement} ${selectedElementId === element.id ? styles.selected : ''}`}
                style={{
                  position: 'absolute',
                  left: element.position.left,
                  top: element.position.top,
                  transform: element.position.transform,
                  zIndex: element.position.zIndex,
                  fontFamily: element.style.fontFamily,
                  fontSize: element.style.fontSize,
                  color: element.style.color,
                  textAlign: element.style.textAlign as any,
                  fontWeight: element.style.fontWeight,
                  fontStyle: element.style.fontStyle,
                  cursor: isDragging && selectedElementId === element.id ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  const input = document.createElement('textarea');
                  input.value = element.content;
                  input.style.cssText = `
                    position: absolute;
                    left: ${element.position.left};
                    top: ${element.position.top};
                    font-family: ${element.style.fontFamily};
                    font-size: ${element.style.fontSize};
                    color: ${element.style.color};
                    text-align: ${element.style.textAlign};
                    font-weight: ${element.style.fontWeight};
                    font-style: ${element.style.fontStyle};
                    background: transparent;
                    border: none;
                    outline: none;
                    resize: none;
                    z-index: 1000;
                  `;
                  
                  input.onblur = () => {
                    handleTextInput(element.id, input.value);
                    input.remove();
                  };
                  
                  input.oninput = () => {
                    handleTextInput(element.id, input.value);
                  };
                  
                  slideContainerRef.current?.appendChild(input);
                  input.focus();
                  input.select();
                }}
              >
                {element.content}
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.footer}>
          <p>Click and drag text elements to move them. Double-click to edit text.</p>
        </div>
      </div>
    </div>
  );
};

export default SlideEditModal; 