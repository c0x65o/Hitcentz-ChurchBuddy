import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ISlide } from '../../types/ISlide';
import SlideRenderer from '../SlideRenderer/SlideRenderer';
import { convertToContenteditable } from '../../utils/slideUtils';
import styles from './SlideEditor.module.css';

interface SlideEditorProps {
  slide: ISlide;
  onSave: (updatedSlide: ISlide) => void;
  onClose: () => void;
}

interface EditableElement {
  id: string;
  element: HTMLDivElement;
  isSelected: boolean;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({ slide, onSave, onClose }) => {
  const [selectedElement, setSelectedElement] = useState<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(convertToContenteditable(slide));
  
  const slideRendererRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const elementToolbarRef = useRef<HTMLDivElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const layerControlsRef = useRef<HTMLDivElement>(null);
  const layerDividerRef = useRef<HTMLDivElement>(null);

  // Initialize editor
  useEffect(() => {
    if (slideRendererRef.current) {
      loadSlideContent();
    }
  }, [slide]);

  const loadSlideContent = useCallback(() => {
    if (!slideRendererRef.current) return;
    
    // Make all editable elements interactive
    const editableElements = slideRendererRef.current.querySelectorAll('.editable-element');
    editableElements.forEach((element) => {
      makeElementInteractive(element as HTMLDivElement);
    });
    
    // Ensure proper z-index stacking
    let maxZ = 0;
    editableElements.forEach((el) => {
      const z = parseInt((el as HTMLDivElement).style.zIndex, 10);
      if (!isNaN(z) && z > maxZ) maxZ = z;
    });
    
    editableElements.forEach((el) => {
      if (!(el as HTMLDivElement).style.zIndex) {
        (el as HTMLDivElement).style.zIndex = (++maxZ).toString();
      }
    });
    
    setSelectedElement(null);
  }, [currentSlide]);

  const makeElementInteractive = useCallback((element: HTMLDivElement) => {
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle bottom-right';
    element.appendChild(resizeHandle);

    // Disable default drag behavior on images to prevent duplication
    const imgEl = element.querySelector('img');
    if (imgEl) {
      imgEl.draggable = false;
      imgEl.addEventListener('dragstart', (e) => e.preventDefault());
    }

    let startX: number, startY: number, startWidth: number, startHeight: number, offsetX: number, offsetY: number;
    
    const onElementMouseDown = (e: MouseEvent) => {
      // Prevent starting drag on contenteditable part
      if ((e.target as HTMLElement).isContentEditable) return;
      e.preventDefault();
      selectElement(element);

      setIsDragging(true);
      offsetX = e.clientX - element.offsetLeft;
      offsetY = e.clientY - element.offsetTop;
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    const onResizeMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectElement(element);
      
      setIsResizing(true);
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(document.defaultView!.getComputedStyle(element).width, 10);
      startHeight = parseInt(document.defaultView!.getComputedStyle(element).height, 10);
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        element.style.left = (e.clientX - offsetX) + 'px';
        element.style.top = (e.clientY - offsetY) + 'px';
      }
      if (isResizing) {
        const newWidth = startWidth + e.clientX - startX;
        element.style.width = newWidth + 'px';
        // If it's an image, maintain aspect ratio
        const img = element.querySelector('img');
        if (img) {
          element.style.height = 'auto';
        } else {
          element.style.height = (startHeight + e.clientY - startY) + 'px';
        }
      }
    };

    const onMouseUp = () => {
      if (isResizing && element.querySelector('img')) {
        element.style.height = element.getBoundingClientRect().height + 'px';
      }
      if (isDragging || isResizing) {
        saveSlideContent();
      }
      setIsDragging(false);
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    element.addEventListener('mousedown', onElementMouseDown);
    resizeHandle.addEventListener('mousedown', onResizeMouseDown);
    
    // Save on content change
    const contentEl = element.querySelector('[contenteditable]');
    if (contentEl) {
      contentEl.addEventListener('input', saveSlideContent);
    }
  }, [isDragging, isResizing]);

  const selectElement = useCallback((element: HTMLDivElement | null) => {
    // Deselect previous
    if (selectedElement) {
      selectedElement.classList.remove('selected');
    }

    setSelectedElement(element);

    if (element) {
      element.classList.add('selected');
      if (deleteBtnRef.current) deleteBtnRef.current.disabled = false;
      if (layerControlsRef.current) layerControlsRef.current.style.display = 'flex';
      if (layerDividerRef.current) layerDividerRef.current.style.display = 'block';
      updateElementToolbar(element);
    } else {
      // Nothing selected, clear the element toolbar
      if (deleteBtnRef.current) deleteBtnRef.current.disabled = true;
      if (layerControlsRef.current) layerControlsRef.current.style.display = 'none';
      if (layerDividerRef.current) layerDividerRef.current.style.display = 'none';
      if (elementToolbarRef.current) {
        elementToolbarRef.current.innerHTML = '<span className={styles.toolbarPlaceholder}>Select an element to see formatting options</span>';
      }
    }
  }, [selectedElement]);

  const updateElementToolbar = useCallback((element: HTMLDivElement) => {
    if (!elementToolbarRef.current) return;

    // Check if it's an image element
    const imgEl = element.querySelector('img');
    if (imgEl) {
      elementToolbarRef.current.innerHTML = `
        <button className={styles.toolbarBtn} data-action="rotate" title="Rotate 90°">
          <i className="fas fa-sync-alt"></i>
        </button>
      `;
      return;
    }

    // For text elements
    const contentEl = element.querySelector('[contenteditable]');
    if (contentEl) {
      const style = window.getComputedStyle(contentEl);
      elementToolbarRef.current.innerHTML = `
        <select data-property="fontFamily">
          <option>Arial</option>
          <option>Verdana</option>
          <option>Georgia</option>
          <option>Times New Roman</option>
          <option>Poppins</option>
        </select>
        <input type="number" data-property="fontSize" value="${parseInt(style.fontSize)}" min="1">
        <input type="color" data-property="color" value="${rgbToHex(style.color)}">
        <div className={styles.toolbarDivider}></div>
        <button className={styles.toolbarBtn} data-action="bold">
          <i className="fas fa-bold"></i>
        </button>
        <button className={styles.toolbarBtn} data-action="italic">
          <i className="fas fa-italic"></i>
        </button>
        <button className={styles.toolbarBtn} data-action="underline">
          <i className="fas fa-underline"></i>
        </button>
      `;
      const fontSelect = elementToolbarRef.current.querySelector('[data-property="fontFamily"]') as HTMLSelectElement;
      if (fontSelect) {
        fontSelect.value = style.fontFamily.split(',')[0].replace(/"/g, '');
      }
    } else {
      selectElement(null);
    }
  }, []);

  const rgbToHex = (rgb: string): string => {
    const a = rgb.split("(")[1].split(")")[0];
    const b = a.split(",").map((x) => {
      const hex = parseInt(x).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    });
    return "#" + b.join("");
  };

  const saveSlideContent = useCallback(() => {
    if (!slideRendererRef.current) return;
    
    const slideContent = slideRendererRef.current.querySelector('[data-slide-content="true"]');
    if (!slideContent) return;
    
    const cleanContent = slideContent.cloneNode(true) as HTMLDivElement;
    cleanContent.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    cleanContent.querySelectorAll('.resize-handle').forEach(h => h.remove());
    
    const updatedSlide: ISlide = {
      ...currentSlide,
      html: cleanContent.innerHTML
    };
    
    setCurrentSlide(updatedSlide);
    onSave(updatedSlide);
  }, [currentSlide, onSave]);

  const addTextBox = useCallback(() => {
    if (!slideRendererRef.current) return;
    
    const slideContent = slideRendererRef.current.querySelector('[data-slide-content="true"]');
    if (!slideContent) return;
    
    const element = document.createElement('div');
    element.className = 'editable-element';
    element.style.top = '50px';
    element.style.left = '50px';
    element.style.width = '200px';
    element.style.height = '50px';
    element.style.zIndex = (getTopZIndex() + 1).toString();

    element.innerHTML = `<div contenteditable="true" style="color: #ffffff; font-size: 24px;">New Text</div>`;

    slideContent.appendChild(element);
    makeElementInteractive(element);
    selectElement(element);
    saveSlideContent();
  }, [makeElementInteractive, selectElement, saveSlideContent]);

  const getTopZIndex = useCallback(() => {
    if (!slideRendererRef.current) return 0;
    
    let maxZ = 0;
    slideRendererRef.current.querySelectorAll('.editable-element').forEach(el => {
      const z = parseInt((el as HTMLDivElement).style.zIndex, 10) || 0;
      if (z > maxZ) maxZ = z;
    });
    return maxZ;
  }, []);

  const deleteSelectedElement = useCallback(() => {
    if (!selectedElement) return;
    selectedElement.remove();
    selectElement(null);
    saveSlideContent();
  }, [selectedElement, selectElement, saveSlideContent]);

  const handleToolbarClick = useCallback((e: React.MouseEvent) => {
    const button = (e.target as HTMLElement).closest('button[data-action]') as HTMLButtonElement;
    if (!button) return;

    switch (button.dataset.action) {
      case 'add-text':
        addTextBox();
        break;
      case 'delete-element':
        deleteSelectedElement();
        break;
      case 'move-forward':
        moveSelectedElement(1);
        break;
      case 'move-backward':
        moveSelectedElement(-1);
        break;
      case 'move-to-front':
        moveSelectedElement('front');
        break;
      case 'move-to-back':
        moveSelectedElement('back');
        break;
    }
  }, [addTextBox, deleteSelectedElement]);

  const moveSelectedElement = useCallback((direction: number | 'front' | 'back') => {
    if (!selectedElement || !slideRendererRef.current) return;

    const elements = Array.from(slideRendererRef.current.querySelectorAll('.editable-element'))
      .sort((a, b) => (parseInt((a as HTMLDivElement).style.zIndex, 10) || 0) - (parseInt((b as HTMLDivElement).style.zIndex, 10) || 0));

    if (direction === 'front') {
      const topZ = parseInt((elements[elements.length - 1] as HTMLDivElement).style.zIndex, 10) || 0;
      selectedElement.style.zIndex = (topZ + 1).toString();
    } else if (direction === 'back') {
      const bottomZ = parseInt((elements[0] as HTMLDivElement).style.zIndex, 10) || 0;
      selectedElement.style.zIndex = (bottomZ - 1).toString();
    } else {
      const currentIndex = elements.findIndex(el => el === selectedElement);
      const newIndex = currentIndex + (direction as number);

      if (newIndex >= 0 && newIndex < elements.length) {
        const otherElement = elements[newIndex] as HTMLDivElement;
        // Swap z-indices
        [selectedElement.style.zIndex, otherElement.style.zIndex] =
          [otherElement.style.zIndex, selectedElement.style.zIndex];
      }
    }
    saveSlideContent();
  }, [selectedElement, saveSlideContent]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === slideRendererRef.current) {
      selectElement(null);
    }
  }, [selectElement]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && 
        selectedElement && 
        document.activeElement !== selectedElement.querySelector('[contenteditable]')) {
      e.preventDefault();
      deleteSelectedElement();
    }
  }, [selectedElement, deleteSelectedElement]);

  return (
    <div className={styles.slideEditorContainer} tabIndex={-1} onKeyDown={handleKeyDown}>
      <div className={styles.slideEditorToolbar} ref={toolbarRef}>
        <div className={styles.toolbarGroup}>
          <button className={styles.toolbarBtn} data-action="add-text" title="Add Text Box" onClick={handleToolbarClick}>
            <i className="fas fa-font"></i> Add Text
          </button>
        </div>
        <div className={styles.toolbarDivider}></div>
        
        {/* Context-sensitive tools for the selected element appear here */}
        <div ref={elementToolbarRef} className={styles.toolbarGroup}>
          <span className={styles.toolbarPlaceholder}>Select an element to see formatting options</span>
        </div>
        
        <div className={styles.toolbarGroup} style={{ marginLeft: 'auto' }}>
          <div ref={layerControlsRef} className={styles.toolbarGroup} style={{ display: 'none' }}>
            <button className={styles.toolbarBtn} data-action="move-to-back" title="Send to Back" onClick={handleToolbarClick}>
              <i className="fas fa-angle-double-down"></i>
            </button>
            <button className={styles.toolbarBtn} data-action="move-backward" title="Move Backward" onClick={handleToolbarClick}>
              <i className="fas fa-level-down-alt"></i>
            </button>
            <button className={styles.toolbarBtn} data-action="move-forward" title="Move Forward" onClick={handleToolbarClick}>
              <i className="fas fa-level-up-alt"></i>
            </button>
            <button className={styles.toolbarBtn} data-action="move-to-front" title="Bring to Front" onClick={handleToolbarClick}>
              <i className="fas fa-angle-double-up"></i>
            </button>
          </div>
          <div ref={layerDividerRef} className={styles.toolbarDivider} style={{ display: 'none', margin: '0 8px' }}></div>
          <button ref={deleteBtnRef} className={styles.toolbarBtn} data-action="delete-element" title="Delete Selected" disabled onClick={handleToolbarClick}>
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      
      <div className={styles.slideEditorMain}>
        <div className={styles.slideEditorCanvasWrapper}>
          <div ref={slideRendererRef} onMouseDown={handleCanvasMouseDown}>
            <SlideRenderer
              slide={currentSlide}
              isEditable={true}
              className={styles.slideCanvas}
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 