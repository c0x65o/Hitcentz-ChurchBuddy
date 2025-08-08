import React from 'react';
import styles from './SlideEditorModal.module.css';
import { ISlide } from '../../types/ISlide';
import SlideRenderer from '../SlideRenderer/SlideRenderer';
import MyMediaLibrary from '../MyMediaLibrary/MyMediaLibrary';

interface SlideEditorModalProps {
  slide: ISlide;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSlide: ISlide, shouldCloseModal?: boolean) => void;
  isEmbedded?: boolean;
}

const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  slide,
  isOpen,
  onClose,
  onSave,
  isEmbedded = false
}) => {
  const [currentSlideHtml, setCurrentSlideHtml] = React.useState(slide.html);
  // const [saveAttempts, setSaveAttempts] = React.useState(0); // COMMENTED OUT - UNUSED
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = React.useState(false);
  const [isSelectingBackground, setIsSelectingBackground] = React.useState(false);
  const [hasBackground, setHasBackground] = React.useState(false);

  // Update HTML when slide changes
  React.useEffect(() => {
    console.log('=== MODAL OPENED - LOADING SLIDE HTML ===');
    console.log('Original slide HTML:', slide.html);
    
    // Clean any existing handles or duplicates from the loaded HTML
    let cleanInitialHtml = slide.html;
    cleanInitialHtml = cleanInitialHtml.replace(/<div[^>]*class="[^"]*resize-handle[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanInitialHtml = cleanInitialHtml.replace(/<div[^>]*data-handle-name="[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanInitialHtml = cleanInitialHtml.replace(/<div[^>]*data-handle-type="[^"]*"[^>]*>.*?<\/div>/gi, '');
    // REMOVED: Don't strip positioned elements anymore - we need to preserve drag positioning
    // cleanInitialHtml = cleanInitialHtml.replace(/<div[^>]*style="[^"]*position:\s*absolute[^"]*"[^>]*>.*?<\/div>/gi, '');
    
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
    
    // Detect background via HTML comment
    const bgMatch = cleanInitialHtml.match(/<!--BACKGROUND:(.*?)-->/i);
    const bgUrl = bgMatch ? bgMatch[1] : null;
    setHasBackground(!!bgUrl);
    if (bgUrl) {
      // Apply after 50ms to allow DOM render
      setTimeout(() => applyBackgroundStyle(bgUrl), 50);
    }

    // Initialize z-index for elements after DOM renders
    setTimeout(() => {
      initializeElementZIndex();
    }, 100);
  }, [slide.html]);

  // Initialize z-index when slide content changes
  React.useEffect(() => {
    if (isOpen && currentSlideHtml) {
      setTimeout(() => {
        initializeElementZIndex();
      }, 200);
    }
  }, [currentSlideHtml, isOpen]);

  // Add keyboard event listener for delete functionality
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Delete or Backspace key is pressed
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
        if (selectedElement) {
          // Only delete the element if it's not in edit mode (not contentEditable)
          if (selectedElement.contentEditable !== 'true') {
            // Prevent default browser behavior
            e.preventDefault();
            
            console.log('Deleting selected element:', selectedElement.tagName);
            
            // Remove the element from DOM
            if (selectedElement.parentNode) {
              selectedElement.parentNode.removeChild(selectedElement);
            }
            
            // Clean up any handles associated with this specific element
            const elementId = selectedElement.dataset.elementId;
            if (elementId) {
              const elementHandles = document.querySelectorAll(`[data-element-id="${elementId}"]`);
              elementHandles.forEach(handle => {
                if (handle.parentNode) {
                  handle.parentNode.removeChild(handle);
                }
              });
            }
            
            // Save the updated state
            saveElementState();
          }
          // If contentEditable is 'true', let the browser handle normal text editing
        }
      }
    };

    // Add event listener when modal is open
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Initialize z-index for elements that don't have one
  const initializeElementZIndex = () => {
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    if (!slideContent) return;

    const elements = slideContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, img, iframe');
    console.log('Initializing z-index for', elements.length, 'elements');
    
    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      if (!htmlElement.style.zIndex || htmlElement.style.zIndex === 'auto') {
        // Give each element a default z-index starting from 1
        const defaultZIndex = (index + 1).toString();
        htmlElement.style.zIndex = defaultZIndex;
        console.log(`Element ${index} (${htmlElement.tagName}) assigned z-index: ${defaultZIndex}`);
      } else {
        console.log(`Element ${index} (${htmlElement.tagName}) already has z-index: ${htmlElement.style.zIndex}`);
      }
    });
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
      
      // Create the HTML for the new element
      const newElementHtml = newTextElement.outerHTML;
      const updatedHtml = currentSlideHtml + newElementHtml;
      
      console.log('Adding new element to HTML:', newElementHtml);
      console.log('Updated HTML length:', updatedHtml.length);
      
      // Update the state - this will trigger SlideRenderer re-render
      setCurrentSlideHtml(updatedHtml);
      
      // Make it immediately editable after React re-renders
      setTimeout(() => {
        const renderedElement = document.querySelector(`#${newTextElement.id}`) as HTMLElement;
        if (renderedElement) {
          renderedElement.click();
          console.log('Triggered click on new text element for immediate editing');
        } else {
          console.log('Could not find rendered element, trying alternative selector');
          // Fallback: find the most recently added h2 element
          const allH2Elements = document.querySelectorAll('[data-slide-id="modal-editor"] h2');
          const lastH2 = allH2Elements[allH2Elements.length - 1] as HTMLElement;
          if (lastH2) {
            lastH2.click();
            console.log('Triggered click on last h2 element as fallback');
          }
        }
      }, 50); // Shorter timeout since we're not doing DOM manipulation
      
    } catch (error) {
      console.error('Error adding new text box:', error);
    }
  };

  // Media Library handlers
  const handleOpenMediaLibrary = () => {
    setIsMediaLibraryOpen(true);
  };

  const handleCloseMediaLibrary = () => {
    setIsMediaLibraryOpen(false);
  };

  const handleSelectMedia = (media: any) => {
    console.log('Selected media:', media);
    console.log('isSelectingBackground:', isSelectingBackground);
    
    // Add image to slide or set as background based on context
    if (media.type === 'image') {
      if (isSelectingBackground) {
        console.log('Adding as background image:', media.url);
        handleSetBackground(media.url);
        setIsSelectingBackground(false);
      } else {
        console.log('Adding as image element:', media.url);
        handleAddImage(media.url, media.name);
      }
    }
    setIsMediaLibraryOpen(false);
  };

  // Font and styling handlers
  const handleFontFamilyChange = (fontFamily: string) => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      selectedElement.style.fontFamily = fontFamily;
      
      // Use the same pattern as handleTextEdit
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (slideContentEl) {
        const cleanHtml = slideContentEl.innerHTML;
        setCurrentSlideHtml(cleanHtml);
        
        const updatedSlide: ISlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
      }
    }
  };

  const handleFontSizeChange = (fontSize: string) => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      selectedElement.style.fontSize = `${fontSize}px`;
      
      // Use the same pattern as handleTextEdit
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (slideContentEl) {
        const cleanHtml = slideContentEl.innerHTML;
        setCurrentSlideHtml(cleanHtml);
        
        const updatedSlide: ISlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
      }
    }
  };

  const handleColorChange = (color: string) => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      selectedElement.style.color = color;
      
      // Use the same pattern as handleTextEdit
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (slideContentEl) {
        const cleanHtml = slideContentEl.innerHTML;
        setCurrentSlideHtml(cleanHtml);
        
        const updatedSlide: ISlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
      }
    }
  };

  const handleBoldToggle = () => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      const currentWeight = selectedElement.style.fontWeight || 'normal';
      selectedElement.style.fontWeight = currentWeight === 'bold' ? 'normal' : 'bold';
      
      // Use the same pattern as handleTextEdit
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (slideContentEl) {
        const cleanHtml = slideContentEl.innerHTML;
        setCurrentSlideHtml(cleanHtml);
        
        const updatedSlide: ISlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
      }
    }
  };

  const handleItalicToggle = () => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      const currentStyle = selectedElement.style.fontStyle || 'normal';
      selectedElement.style.fontStyle = currentStyle === 'italic' ? 'normal' : 'italic';
      
      // Use the same pattern as handleTextEdit
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (slideContentEl) {
        const cleanHtml = slideContentEl.innerHTML;
        setCurrentSlideHtml(cleanHtml);
        
        const updatedSlide: ISlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
      }
    }
  };

  const handleRotate = () => {
    console.log('=== ROTATE BUTTON CLICKED ===');
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    console.log('Selected element:', selectedElement);
    
    if (selectedElement) {
      // Get current rotation
      const currentTransform = selectedElement.style.transform || '';
      const rotationMatch = currentTransform.match(/rotate\(([^)]+)deg\)/);
      const currentRotation = rotationMatch ? parseInt(rotationMatch[1]) : 0;
      
      // Add 90 degrees
      const newRotation = currentRotation + 90;
      
      // Apply new rotation while preserving existing transforms
      const transformWithoutRotation = currentTransform.replace(/rotate\([^)]+deg\)/, '').trim();
      selectedElement.style.transform = `${transformWithoutRotation} rotate(${newRotation}deg)`.trim();
      
      console.log(`Rotated element: ${currentRotation}° -> ${newRotation}°`);
      console.log('New transform:', selectedElement.style.transform);
      
      // Use the same pattern as handleTextEdit
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (slideContentEl) {
        const cleanHtml = slideContentEl.innerHTML;
        setCurrentSlideHtml(cleanHtml);
        
        const updatedSlide: ISlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
      }
    } else {
      console.log('No element selected for rotation');
    }
  };

  // Get current font properties for toolbar display
  const getSelectedElementProperties = () => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      return {
        fontFamily: selectedElement.style.fontFamily || 'Helvetica Neue',
        fontSize: selectedElement.style.fontSize || '24px',
        color: selectedElement.style.color || '#ffffff',
        fontWeight: selectedElement.style.fontWeight || 'normal',
        fontStyle: selectedElement.style.fontStyle || 'normal'
      };
    }
    return null;
  };

  const handleAddImage = (imageUrl: string, imageName: string) => {
    // Safety check: don't add image element if we're selecting background
    if (isSelectingBackground) {
      console.log('Preventing image element addition while selecting background');
      return;
    }
    
    console.log('Creating image element:', imageUrl);
    
    // Create image element for HTML generation
    const imgElement = document.createElement('img');
    imgElement.src = imageUrl;
    imgElement.alt = imageName;
    imgElement.style.position = 'absolute';
    imgElement.style.left = '50%';
    imgElement.style.top = '50%';
    imgElement.style.transform = 'translate(-50%, -50%)';
    imgElement.style.cursor = 'grab';
    imgElement.style.zIndex = '10';
    
    // Add the same styling as text elements for edit mode
    imgElement.style.minWidth = '100px';
    imgElement.style.minHeight = '30px';
    imgElement.style.padding = '8px';
    imgElement.style.border = '1px dashed #007bff';
    imgElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    imgElement.style.borderRadius = '4px';
    imgElement.title = 'Click to select, drag to move';
    
    // Update HTML state - this will trigger SlideRenderer re-render
    const newImageHtml = imgElement.outerHTML;
    setCurrentSlideHtml(prev => prev + newImageHtml);
    
    // Note: Image sizing will be handled by the SlideRenderer's edit mode styling
    // The onload handler for natural size will be applied when the image renders
  };

  // const handleRotateImage = () => {
  //   const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
  //   if (selectedElement && selectedElement.tagName === 'IMG') {
  //     const imgElement = selectedElement as HTMLImageElement;
  //     const currentRotation = getCurrentRotation(selectedElement);
  //     const newRotation = currentRotation + 90;
  //     selectedElement.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
  //     handleTextEdit(selectedElement, imgElement.alt || '');
  //   }
  // };

  // Helper functions
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // const getCurrentRotation = (element: HTMLElement): number => {
  //   const transform = element.style.transform;
  //   const match = transform.match(/rotate\((\d+)deg\)/);
  //   return match ? parseInt(match[1]) : 0;
  // };

  // Background handlers
  const applyBackgroundStyle = (backgroundUrl: string | null) => {
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    if (!slideContent) return;
    const slideContainer = slideContent.parentElement as HTMLElement | null;
    if (!slideContainer) return;
    
    if (backgroundUrl) {
      // Only handle image backgrounds now
      slideContainer.style.backgroundImage = `url(${backgroundUrl})`;
      slideContainer.style.backgroundSize = 'contain';
      slideContainer.style.backgroundPosition = 'center';
      slideContainer.style.backgroundRepeat = 'no-repeat';
    } else {
      // Remove all backgrounds
      slideContainer.style.backgroundImage = '';
      slideContainer.style.backgroundSize = '';
      slideContainer.style.backgroundPosition = '';
      slideContainer.style.backgroundRepeat = '';
    }
  };

  const commentRegex = /<!--BACKGROUND:(.*?)-->/i;

  const handleAddBackground = () => {
    setIsSelectingBackground(true);
    setIsMediaLibraryOpen(true);
  };

  const handleSetBackground = (imageUrl: string) => {
    // Remove existing BACKGROUND comment if present
    let newHtml = currentSlideHtml.replace(commentRegex, '');
    // Prepend new BACKGROUND comment
    newHtml = `<!--BACKGROUND:${imageUrl}-->` + newHtml;
    setCurrentSlideHtml(newHtml);

    // Apply CSS background immediately
    applyBackgroundStyle(imageUrl);

    // Save slide
    onSave({ ...slide, html: newHtml, updatedAt: new Date() }, false);
    setHasBackground(true);
  };

  const handleRemoveBackground = () => {
    const newHtml = currentSlideHtml.replace(commentRegex, '');
    setCurrentSlideHtml(newHtml);

    // Clear CSS background
    applyBackgroundStyle(null);

    onSave({ ...slide, html: newHtml, updatedAt: new Date() }, false);
    setHasBackground(false);
  };

  // Delete selected element function
  const handleDeleteSelected = () => {
    console.log('=== DELETE SELECTED ELEMENT CALLED ===');
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      console.log('Found selected element to delete:', selectedElement.tagName);
      console.log('Selected element HTML before deletion:', selectedElement.outerHTML);
      
      // Clean up any handles associated with this specific element
      const selectedElementId = selectedElement.dataset.elementId;
      if (selectedElementId) {
        const elementHandles = document.querySelectorAll(`[data-element-id="${selectedElementId}"]`);
        console.log('Found', elementHandles.length, 'handles to clean up for element ID:', selectedElementId);
        elementHandles.forEach(handle => {
          if (handle.parentNode) {
            handle.parentNode.removeChild(handle);
          }
        });
      }
      
      // Remove the element from DOM (same as working functions)
      if (selectedElement.parentNode) {
        selectedElement.parentNode.removeChild(selectedElement);
        console.log('Element removed from DOM');
      }
      
      // Use the same pattern as handleTextEdit - read the entire HTML from the slide content container
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (slideContentEl) {
        const cleanHtml = slideContentEl.innerHTML;
        setCurrentSlideHtml(cleanHtml);
        
        const updatedSlide: ISlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
        console.log('=== DELETION SAVE COMPLETE ===');
      } else {
        console.error('Slide content element not found for saving!');
      }
    } else {
      console.log('No selected element found to delete');
    }
  };

  // Helper function to save element state without ghost boxes
  const saveElementState = () => {
    console.log('=== SAVE ELEMENT STATE CALLED ===');
    
    // Remove any existing handles before saving
    const existingHandles = document.querySelectorAll('[data-handle-name], [data-handle-type], [data-element-id]');
    console.log('Removing', existingHandles.length, 'existing handles');
    existingHandles.forEach(handle => {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle);
      }
    });

    // Get the current HTML content from the DOM
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    if (!slideContent) {
      console.error('ERROR: Could not find slide content element in saveElementState');
      return;
    }

    // Get the actual content from within the SlideRenderer
    const actualContent = slideContent.querySelector('[data-slide-content="true"]');
    if (!actualContent) {
      console.error('ERROR: Could not find actual content element in saveElementState');
      return;
    }

    // Log the raw HTML before cleaning
    const rawHtml = actualContent.innerHTML;
    console.log('Raw HTML in saveElementState (length:', rawHtml.length, '):', rawHtml);

    // Clean the HTML by removing any temporary elements or handles
    let cleanHtml = actualContent.innerHTML;
    
    // Remove any remaining handle elements that might have been missed
    // Use a more specific regex that only targets actual handle elements
    const beforeCleaning = cleanHtml;
    cleanHtml = cleanHtml.replace(/<div[^>]*class="[^"]*resize-handle[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanHtml = cleanHtml.replace(/<div[^>]*data-handle-name="[^"]*"[^>]*>.*?<\/div>/gi, '');
    cleanHtml = cleanHtml.replace(/<div[^>]*data-handle-type="[^"]*"[^>]*>.*?<\/div>/gi, '');
    
    console.log('HTML before cleaning (length:', beforeCleaning.length, '):', beforeCleaning);
    console.log('HTML after cleaning (length:', cleanHtml.length, '):', cleanHtml);
    
    // Check if content was accidentally removed
    if (beforeCleaning.length > cleanHtml.length + 100) { // Allow for some handle removal
      console.warn('WARNING: Significant HTML reduction detected during cleaning!');
      console.log('Reduction:', beforeCleaning.length - cleanHtml.length, 'characters');
    }
    
    // Update the state with the cleaned HTML
    setCurrentSlideHtml(cleanHtml);
    
    // Save the slide
    const updatedSlide = {
      ...slide,
      html: cleanHtml,
      updatedAt: new Date()
    };
    console.log('Saving slide with HTML length:', cleanHtml.length);
    onSave(updatedSlide, false);
  };

  // Auto-save all changes before modal closes
  const handleClose = () => {
    console.log('=== MODAL CLOSING - DEBUGGING SAVE PROCESS ===');
    
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
    /* REMOVED: This was too aggressive and deleted content.
    const possibleHandles = document.querySelectorAll('div[style*="position: absolute"]');
    possibleHandles.forEach(element => {
      const style = (element as HTMLElement).style;
      const hasHandleCharacteristics = (
        (style.width === '12px' && style.height === '12px') || // Corner handles
        // (style.width === '36px' && style.height === '36px') || // Drag/rotate handles - COMMENTED OUT
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
    */
    
    // Capture all current element states and save them
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    console.log('Found slide content element:', slideContent);
    
    if (slideContent) {
      // Get the actual content from within the SlideRenderer
      const actualContent = slideContent.querySelector('[data-slide-content="true"]');
      console.log('Found actual content element:', actualContent);
      
      if (actualContent) {
        // Log the raw HTML before any cleaning
        const rawHtml = actualContent.innerHTML;
        console.log('Raw HTML before cleaning (length:', rawHtml.length, '):', rawHtml);
        
        // Save the entire HTML content directly instead of trying to save individual elements
        const cleanHtml = actualContent.innerHTML;
        console.log('Clean HTML after cleaning (length:', cleanHtml.length, '):', cleanHtml);
        
        // Check if the HTML contains actual content
        const hasContent = cleanHtml.trim().length > 0;
        console.log('HTML has content:', hasContent);
        
        if (!hasContent) {
          console.error('WARNING: HTML is empty after cleaning!');
          console.log('Current slide HTML state:', currentSlideHtml);
        }
        
        // Update the state with the cleaned HTML
        setCurrentSlideHtml(cleanHtml);
        
        // Save the slide
        const updatedSlide = {
          ...slide,
          html: cleanHtml,
          updatedAt: new Date()
        };
        console.log('Saving updated slide with HTML length:', cleanHtml.length);
        onSave(updatedSlide, false);
      } else {
        console.error('ERROR: Could not find actual content element within slide content!');
        // Fallback: use the current state
        console.log('Using current slide HTML state as fallback:', currentSlideHtml);
        const updatedSlide = {
          ...slide,
          html: currentSlideHtml,
          updatedAt: new Date()
        };
        onSave(updatedSlide, false);
      }
    } else {
      console.error('ERROR: Could not find slide content element!');
    }
    
    // Small delay to ensure all saves complete, then close
    setTimeout(() => {
      console.log('Auto-save complete, closing modal');
      console.log('Final slide HTML before close:', currentSlideHtml);
      onClose();
    }, 200);
  };

  // Layer management functions
  const getElementsInSlide = (): HTMLElement[] => {
    const container = document.querySelector('[data-slide-id="modal-editor"]');
    if (!container) {
      console.log('Container not found');
      return [];
    }
    // Include all element types including videos (iframes)
    const elements = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, img, iframe, video')) as HTMLElement[];
    console.log('Found', elements.length, 'elements in slide');
    elements.forEach((el, index) => {
      console.log(`Element ${index}:`, el.tagName, 'selected:', el.classList.contains('selected'), 'z-index:', el.style.zIndex);
    });
    return elements;
  };

  const normalizeZIndices = (elements: HTMLElement[]) => {
    // Sort by current z-index ascending and then assign 1,2,3...
    const sorted = elements.sort((a, b) => {
      const za = parseInt((a.style.zIndex || '0'), 10);
      const zb = parseInt((b.style.zIndex || '0'), 10);
      return za - zb;
    });
    sorted.forEach((el, idx) => {
      el.style.zIndex = (idx + 1).toString();
    });
  };

  const handleLayerForward = () => {
    console.log('=== LAYER FORWARD CLICKED ===');
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement | null;
    console.log('Selected element:', selectedElement);
    
    if (!selectedElement) {
      console.log('No element selected for layer forward');
      return;
    }

    const elements = getElementsInSlide();
    console.log('All elements in slide:', elements.length);
    if (elements.length === 0) return;

    normalizeZIndices(elements);

    // Rebuild list after normalization
    const ordered = elements.sort((a, b) => parseInt(a.style.zIndex, 10) - parseInt(b.style.zIndex, 10));
    const idx = ordered.indexOf(selectedElement);
    console.log('Element index in ordered list:', idx);
    
    if (idx === -1 || idx === ordered.length - 1) {
      console.log('Element already at top layer');
      return; // Already at top
    }

    const nextEl = ordered[idx + 1];
    const zSel = selectedElement.style.zIndex;
    selectedElement.style.zIndex = nextEl.style.zIndex;
    nextEl.style.zIndex = zSel;

    console.log(`Moved element forward: z-index ${zSel} -> ${nextEl.style.zIndex}`);
    console.log('Selected element z-index now:', selectedElement.style.zIndex);
    
    // Use the same pattern as handleTextEdit
    const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
    if (slideContentEl) {
      const cleanHtml = slideContentEl.innerHTML;
      setCurrentSlideHtml(cleanHtml);
      
      const updatedSlide: ISlide = {
        ...slide,
        html: cleanHtml,
        updatedAt: new Date()
      };
      onSave(updatedSlide, false);
    }
  };

  const handleLayerBack = () => {
    console.log('=== LAYER BACK CLICKED ===');
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement | null;
    console.log('Selected element:', selectedElement);
    
    if (!selectedElement) {
      console.log('No element selected for layer back');
      return;
    }

    const elements = getElementsInSlide();
    console.log('All elements in slide:', elements.length);
    if (elements.length === 0) return;
    
    normalizeZIndices(elements);
    const ordered = elements.sort((a, b) => parseInt(a.style.zIndex, 10) - parseInt(b.style.zIndex, 10));
    const idx = ordered.indexOf(selectedElement);
    console.log('Element index in ordered list:', idx);
    
    if (idx <= 0) {
      console.log('Element already at bottom layer');
      return; // Already at bottom
    }

    const prevEl = ordered[idx - 1];
    const zSel = selectedElement.style.zIndex;
    selectedElement.style.zIndex = prevEl.style.zIndex;
    prevEl.style.zIndex = zSel;

    console.log(`Moved element back: z-index ${zSel} -> ${prevEl.style.zIndex}`);
    console.log('Selected element z-index now:', selectedElement.style.zIndex);
    
    // Use the same pattern as handleTextEdit
    const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
    if (slideContentEl) {
      const cleanHtml = slideContentEl.innerHTML;
      setCurrentSlideHtml(cleanHtml);
      
      const updatedSlide: ISlide = {
        ...slide,
        html: cleanHtml,
        updatedAt: new Date()
      };
      onSave(updatedSlide, false);
    }
  };

  const handleSendToBack = () => {
    console.log('=== SEND TO BACK CLICKED ===');
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement | null;
    console.log('Selected element:', selectedElement);
    
    if (!selectedElement) {
      console.log('No element selected for send to back');
      return;
    }

    const elements = getElementsInSlide();
    console.log('All elements in slide:', elements.length);
    if (elements.length === 0) return;
    
    normalizeZIndices(elements);
    const ordered = elements.sort((a, b) => parseInt(a.style.zIndex, 10) - parseInt(b.style.zIndex, 10));
    const idx = ordered.indexOf(selectedElement);
    console.log('Element index in ordered list:', idx);
    
    if (idx === 0) {
      console.log('Element already at bottom layer');
      return; // Already at bottom
    }

    // Move element to the very bottom (z-index 1)
    selectedElement.style.zIndex = '1';
    
    // Shift all other elements up by 1
    ordered.forEach((element, index) => {
      if (element !== selectedElement) {
        element.style.zIndex = (index + 2).toString(); // +2 because selected element is now at 1
      }
    });

    console.log(`Sent element to back: z-index now 1`);
    
    // Use the same pattern as handleTextEdit
    const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
    if (slideContentEl) {
      const cleanHtml = slideContentEl.innerHTML;
      setCurrentSlideHtml(cleanHtml);
      
      const updatedSlide: ISlide = {
        ...slide,
        html: cleanHtml,
        updatedAt: new Date()
      };
      onSave(updatedSlide, false);
    }
  };

  const handleBringToFront = () => {
    console.log('=== BRING TO FRONT CLICKED ===');
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement | null;
    console.log('Selected element:', selectedElement);
    
    if (!selectedElement) {
      console.log('No element selected for bring to front');
      return;
    }

    const elements = getElementsInSlide();
    console.log('All elements in slide:', elements.length);
    if (elements.length === 0) return;
    
    normalizeZIndices(elements);
    const ordered = elements.sort((a, b) => parseInt(a.style.zIndex, 10) - parseInt(b.style.zIndex, 10));
    const idx = ordered.indexOf(selectedElement);
    console.log('Element index in ordered list:', idx);
    
    if (idx === ordered.length - 1) {
      console.log('Element already at top layer');
      return; // Already at top
    }

    // Move element to the very top (highest z-index + 1)
    const maxZIndex = Math.max(...ordered.map(el => parseInt(el.style.zIndex, 10)));
    selectedElement.style.zIndex = (maxZIndex + 1).toString();

    console.log(`Brought element to front: z-index now ${maxZIndex + 1}`);
    
    // Use the same pattern as handleTextEdit
    const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
    if (slideContentEl) {
      const cleanHtml = slideContentEl.innerHTML;
      setCurrentSlideHtml(cleanHtml);
      
      const updatedSlide: ISlide = {
        ...slide,
        html: cleanHtml,
        updatedAt: new Date()
      };
      onSave(updatedSlide, false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only ignore if clicking on the backdrop itself, not on content
    if (e.target === e.currentTarget) {
      console.log('Backdrop clicked - ignoring (backdrop close disabled)');
    }
  };



  const handleTextEdit = (element: HTMLElement, newText: string) => {
    console.log('=== TEXT EDIT START ===');
    console.log('New text:', newText);

    try {
      // Update the element's HTML content (but not for images)
      if (element.tagName !== 'IMG') {
        element.innerHTML = newText;
      }
      // For images, we don't change the content, just save the current state
      
      // Get the updated HTML from the DOM
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (!slideContentEl) {
        console.error('Slide content element not found for saving!');
        return;
      }

      const cleanHtml = slideContentEl.innerHTML;
      setCurrentSlideHtml(cleanHtml);

      // Save the updated slide
      const updatedSlide: ISlide = {
        ...slide,
        html: cleanHtml,
        updatedAt: new Date()
      };
      onSave(updatedSlide, false);
      console.log('Slide HTML saved (length:', cleanHtml.length, ')');

    } catch (err) {
      console.error('Error during text edit save', err);
    }
  };

  const handleAddVideoSlide = () => {
    const videoUrl = prompt('⚠️ WARNING: This will replace your current slide and text cannot be added to it.\n\nEnter YouTube video URL:');
    if (videoUrl) {
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        console.log('=== REPLACING CURRENT SLIDE WITH VIDEO ===');
        console.log('Video ID:', videoId);
        
        // Create video slide HTML with iframe that fills the entire slide
        const videoSlideHtml = `
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=1&rel=0" 
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; z-index: 1; pointer-events: none;"
              frameborder="0"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
          </div>
        `;
        
        console.log('Generated video HTML:', videoSlideHtml);
        
        // Replace the current slide with video HTML
        setCurrentSlideHtml(videoSlideHtml);
        
        // Save the updated slide
        const updatedSlide: ISlide = {
          ...slide,
          html: videoSlideHtml,
          updatedAt: new Date()
        };
        
        console.log('=== VIDEO SLIDE CREATED ===');
        console.log('Slide ID:', updatedSlide.id);
        console.log('Slide Title:', updatedSlide.title);
        console.log('Video HTML:', videoSlideHtml);
        
        onSave(updatedSlide, false);
        console.log('Current slide replaced with video');
        
        // Force a re-render by updating the state again
        setTimeout(() => {
          console.log('Forcing re-render of video slide');
          setCurrentSlideHtml(videoSlideHtml);
        }, 100);
      } else {
        alert('Invalid YouTube URL');
      }
    }
  };

  return (
    <div className={`${styles.backdrop} ${isEmbedded ? styles.embedded : ''}`} onClick={isEmbedded ? undefined : handleBackdropClick}>
      <div className={`${styles.modal} ${isEmbedded ? styles.embeddedModal : ''}`}>
        {/* Close Button - only show in modal mode */}
        {!isEmbedded && (
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            title="Close Editor"
          >
            ×
          </button>
        )}



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
            <select 
              className={styles.toolSelect} 
              title="Font Family"
              onChange={(e) => handleFontFamilyChange(e.target.value)}
            >
              <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica Neue</option>
              <option value="Futura, 'Trebuchet MS', Arial, sans-serif">Futura</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
            </select>
            <input 
              type="number" 
              className={styles.toolInput} 
              placeholder="24" 
              title="Font Size"
              min="8"
              max="500"
              onChange={(e) => handleFontSizeChange(e.target.value)}
            />
            <input 
              type="color" 
              className={styles.colorPicker} 
              defaultValue="#ffffff"
              title="Text Color"
              onChange={(e) => handleColorChange(e.target.value)}
            />
            <button 
              className={styles.toolButton} 
              title="Bold"
              onClick={handleBoldToggle}
            >
              <strong>B</strong>
            </button>
            <button 
              className={styles.toolButton} 
              title="Italic"
              onClick={handleItalicToggle}
            >
              <em>I</em>
            </button>
          </div>

          {/* Other Tools */}
          <div className={styles.toolGroup}>
            <button 
              className={styles.toolButton} 
              title="My Media Library" 
              onClick={handleOpenMediaLibrary}
            >
              Media Library
            </button>
            <button 
              className={styles.toolButton} 
              title={hasBackground ? "Remove Background" : "Add Background"}
              onClick={hasBackground ? handleRemoveBackground : handleAddBackground}
            >
              {hasBackground ? "Remove Background" : "Add Background"}
            </button>
            <button 
              className={styles.toolButton} 
              title="Add Video Slide"
              onClick={handleAddVideoSlide}
            >
              Video Slide
            </button>

            <button 
              className={styles.toolButton} 
              title="Move Layer Forward"
              onClick={() => {
                console.log('Layer Forward button clicked!');
                handleLayerForward();
              }}
            >
              Layer Forward
            </button>
            <button 
              className={styles.toolButton} 
              title="Move Layer Back"
              onClick={() => {
                console.log('Layer Back button clicked!');
                handleLayerBack();
              }}
            >
              Layer Back
            </button>
            <button 
              className={styles.toolButton} 
              title="Send to Back"
              onClick={() => {
                console.log('Send to Back button clicked!');
                handleSendToBack();
              }}
            >
              Send to Back
            </button>
            <button 
              className={styles.toolButton} 
              title="Bring to Front"
              onClick={() => {
                console.log('Bring to Front button clicked!');
                handleBringToFront();
              }}
            >
              Bring to Front
            </button>
            <button 
              className={styles.toolButton} 
              title="Rotate 90°"
              onClick={() => {
                console.log('Rotate button clicked!');
                handleRotate();
              }}
            >
              Rotate
            </button>

            <button 
              className={styles.toolButton} 
              title="Delete Selected Element"
              onClick={() => {
                console.log('Delete button clicked!');
                handleDeleteSelected();
              }}
            >
              Delete
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
                isActive={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* My Media Library Modal */}
      <MyMediaLibrary
        isOpen={isMediaLibraryOpen}
        onClose={handleCloseMediaLibrary}
        onSelectMedia={handleSelectMedia}
      />
    </div>
  );
};

export default SlideEditorModal; 