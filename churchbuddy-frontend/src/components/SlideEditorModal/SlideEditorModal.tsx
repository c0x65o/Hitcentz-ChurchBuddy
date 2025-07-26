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
  const [saveAttempts, setSaveAttempts] = React.useState(0);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = React.useState(false);
  const [isSelectingBackground, setIsSelectingBackground] = React.useState(false);
  const [hasBackground, setHasBackground] = React.useState(false);

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

  // Add keyboard event listener for delete functionality
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Delete or Backspace key is pressed
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
        if (selectedElement) {
          // Prevent default browser behavior
          e.preventDefault();
          
          console.log('Deleting selected element:', selectedElement.tagName);
          
          // Remove the element from DOM
          if (selectedElement.parentNode) {
            selectedElement.parentNode.removeChild(selectedElement);
          }
          
          // Clean up any handles associated with this element
          const existingHandles = document.querySelectorAll('[data-handle-name], [data-handle-type], [data-element-id]');
          existingHandles.forEach(handle => {
            if (handle.parentNode) {
              handle.parentNode.removeChild(handle);
            }
          });
          
          // Save the updated state
          saveElementState();
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
      
      // Add the element to the slide content - target the modal-specific one
      const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
      console.log('Found modal slide content:', slideContent);
      
      if (slideContent) {
        // First, update the HTML state to include the new element
        const newElementHtml = newTextElement.outerHTML;
        const updatedHtml = currentSlideHtml + newElementHtml;
        
        console.log('Adding new element to HTML:', newElementHtml);
        console.log('Updated HTML length:', updatedHtml.length);
        
        // Update the state immediately - this ensures the element is in the HTML for handleTextEdit
        setCurrentSlideHtml(updatedHtml);
        
        // Also add the element directly to the DOM so it's immediately interactive
        // This creates a temporary state where the element exists in both the DOM and the HTML state
        slideContent.appendChild(newTextElement);
        
        // Make it immediately editable
        setTimeout(() => {
          newTextElement.click();
          console.log('Triggered click on new text element for immediate editing');
        }, 100);
        
      } else {
        console.error('Could not find slide content container');
      }
      
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
    // Add image to slide or set as background based on context
    if (media.type === 'image') {
      if (isSelectingBackground) {
        handleSetBackground(media.url);
        setIsSelectingBackground(false);
      } else {
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
      saveElementState();
    }
  };

  const handleFontSizeChange = (fontSize: string) => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      selectedElement.style.fontSize = `${fontSize}px`;
      saveElementState();
    }
  };

  const handleColorChange = (color: string) => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      selectedElement.style.color = color;
      saveElementState();
    }
  };

  const handleBoldToggle = () => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      selectedElement.style.fontWeight = selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold';
      saveElementState();
    }
  };

  const handleItalicToggle = () => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      selectedElement.style.fontStyle = selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic';
      saveElementState();
    }
  };

  const handleAddImage = (imageUrl: string, imageName: string) => {
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    if (slideContent) {
      const imgElement = document.createElement('img');
      imgElement.src = imageUrl;
      imgElement.alt = imageName;
      imgElement.style.position = 'absolute';
      imgElement.style.left = '50%';
      imgElement.style.top = '50%';
      imgElement.style.transform = 'translate(-50%, -50%)';
      imgElement.style.maxWidth = '80%';
      imgElement.style.maxHeight = '80%';
      imgElement.style.cursor = 'pointer';
      imgElement.style.zIndex = '10';
      
      slideContent.appendChild(imgElement);
      
      // Update HTML state
      const newImageHtml = imgElement.outerHTML;
      setCurrentSlideHtml(prev => prev + newImageHtml);
    }
  };

  const handleAddYouTubeVideo = () => {
    const videoUrl = prompt('Enter YouTube video URL:');
    if (videoUrl) {
      const videoId = extractYouTubeId(videoUrl);
      if (videoId) {
        // Create the iframe element for the video
        const iframeElement = document.createElement('iframe');
        iframeElement.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        iframeElement.style.position = 'absolute';
        iframeElement.style.left = '0';
        iframeElement.style.top = '0';
        iframeElement.style.width = '100%';
        iframeElement.style.height = '100%';
        iframeElement.style.border = 'none';
        iframeElement.style.zIndex = '1'; // Lower z-index to be behind other content
        iframeElement.style.objectFit = 'contain';
        iframeElement.style.pointerEvents = 'none'; // Prevent interaction with video
        
        // Set the video as background by adding it to the slide container
        const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
        const slideContainer = slideContent?.parentElement as HTMLElement | null;
        
        if (slideContainer) {
          // Remove any existing background video
          const existingVideo = slideContainer.querySelector('iframe[src*="youtube.com"]');
          if (existingVideo) {
            existingVideo.remove();
          }
          
          // Add the new video as background
          slideContainer.appendChild(iframeElement);
          
          // Update HTML state with background comment
          const videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          let newHtml = currentSlideHtml.replace(/<!--BACKGROUND:.*?-->/i, ''); // Remove existing background
          newHtml = `<!--BACKGROUND:${videoEmbedUrl}-->` + newHtml; // Add new background comment
          setCurrentSlideHtml(newHtml);
          
          // Save the slide
          onSave({ ...slide, html: newHtml, updatedAt: new Date() }, false);
          setHasBackground(true);
        }
      } else {
        alert('Invalid YouTube URL');
      }
    }
  };

  const handleRotateImage = () => {
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement && selectedElement.tagName === 'IMG') {
      const imgElement = selectedElement as HTMLImageElement;
      const currentRotation = getCurrentRotation(selectedElement);
      const newRotation = currentRotation + 90;
      selectedElement.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
      handleTextEdit(selectedElement, imgElement.alt || '');
    }
  };

  // Helper functions
  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getCurrentRotation = (element: HTMLElement): number => {
    const transform = element.style.transform;
    const match = transform.match(/rotate\((\d+)deg\)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Background handlers
  const applyBackgroundStyle = (backgroundUrl: string | null) => {
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    if (!slideContent) return;
    const slideContainer = slideContent.parentElement as HTMLElement | null;
    if (!slideContainer) return;
    
    if (backgroundUrl) {
      // Check if it's a video URL (YouTube embed)
      if (backgroundUrl.includes('youtube.com/embed')) {
        // Remove any existing background image
        slideContainer.style.backgroundImage = '';
        slideContainer.style.backgroundSize = '';
        slideContainer.style.backgroundPosition = '';
        slideContainer.style.backgroundRepeat = '';
        
        // Remove any existing background video
        const existingVideo = slideContainer.querySelector('iframe[src*="youtube.com"]');
        if (existingVideo) {
          existingVideo.remove();
        }
        
        // Create and add the video iframe
        const iframeElement = document.createElement('iframe');
        iframeElement.src = backgroundUrl;
        iframeElement.style.position = 'absolute';
        iframeElement.style.left = '0';
        iframeElement.style.top = '0';
        iframeElement.style.width = '100%';
        iframeElement.style.height = '100%';
        iframeElement.style.border = 'none';
        iframeElement.style.zIndex = '1';
        iframeElement.style.objectFit = 'contain';
        iframeElement.style.pointerEvents = 'none';
        
        // Ensure autoplay parameters are present for YouTube videos
        if (backgroundUrl.includes('youtube.com/embed') && !backgroundUrl.includes('autoplay=1')) {
          const separator = backgroundUrl.includes('?') ? '&' : '?';
          iframeElement.src = `${backgroundUrl}${separator}autoplay=1`;
        }
        
        slideContainer.appendChild(iframeElement);
      } else {
        // It's an image URL
        slideContainer.style.backgroundImage = `url(${backgroundUrl})`;
        slideContainer.style.backgroundSize = 'contain';
        slideContainer.style.backgroundPosition = 'center';
        slideContainer.style.backgroundRepeat = 'no-repeat';
        
        // Remove any existing background video
        const existingVideo = slideContainer.querySelector('iframe[src*="youtube.com"]');
        if (existingVideo) {
          existingVideo.remove();
        }
      }
    } else {
      // Remove all backgrounds
      slideContainer.style.backgroundImage = '';
      slideContainer.style.backgroundSize = '';
      slideContainer.style.backgroundPosition = '';
      slideContainer.style.backgroundRepeat = '';
      
      // Remove any existing background video
      const existingVideo = slideContainer.querySelector('iframe[src*="youtube.com"]');
      if (existingVideo) {
        existingVideo.remove();
      }
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
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement;
    if (selectedElement) {
      console.log('Deleting selected element via toolbar:', selectedElement.tagName);
      
      // Remove the element from DOM
      if (selectedElement.parentNode) {
        selectedElement.parentNode.removeChild(selectedElement);
      }
      
      // Clean up any handles associated with this element
      const existingHandles = document.querySelectorAll('[data-handle-name], [data-handle-type], [data-element-id]');
      existingHandles.forEach(handle => {
        if (handle.parentNode) {
          handle.parentNode.removeChild(handle);
        }
      });
      
      // Save the updated state
      saveElementState();
    }
  };

  // Helper function to save element state without ghost boxes
  const saveElementState = () => {
    // Remove any existing handles before saving
    const existingHandles = document.querySelectorAll('[data-handle-name], [data-handle-type], [data-element-id]');
    existingHandles.forEach(handle => {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle);
      }
    });

    // Get the current HTML content from the DOM
    const slideContent = document.querySelector('[data-slide-id="modal-editor"]');
    if (!slideContent) return;

    // Clean the HTML by removing any temporary elements or handles
    let cleanHtml = slideContent.innerHTML;
    
    // Remove any remaining handle elements that might have been missed
    cleanHtml = cleanHtml.replace(/<div[^>]*data-handle-[^>]*>.*?<\/div>/gi, '');
    
    // Update the state with the cleaned HTML
    setCurrentSlideHtml(cleanHtml);
    
    // Save the slide
    const updatedSlide = {
      ...slide,
      html: cleanHtml,
      updatedAt: new Date()
    };
    onSave(updatedSlide, false);
  };

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

  // Layer management functions
  const getElementsInSlide = (): HTMLElement[] => {
    const container = document.querySelector('[data-slide-id="modal-editor"]');
    if (!container) return [];
    return Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, img, iframe')) as HTMLElement[];
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
    if (!selectedElement) {
      alert('Please select an element first (click on it)');
      return;
    }

    const elements = getElementsInSlide();
    if (elements.length === 0) return;

    normalizeZIndices(elements);

    // Rebuild list after normalization
    const ordered = elements.sort((a, b) => parseInt(a.style.zIndex, 10) - parseInt(b.style.zIndex, 10));
    const idx = ordered.indexOf(selectedElement);
    if (idx === -1 || idx === ordered.length - 1) return; // Already at top

    const nextEl = ordered[idx + 1];
    const zSel = selectedElement.style.zIndex;
    selectedElement.style.zIndex = nextEl.style.zIndex;
    nextEl.style.zIndex = zSel;

    saveElementState();
  };

  const handleLayerBack = () => {
    console.log('=== LAYER BACK CLICKED ===');
    const selectedElement = document.querySelector('[data-slide-id="modal-editor"] .selected') as HTMLElement | null;
    if (!selectedElement) {
      alert('Please select an element first (click on it)');
      return;
    }

    const elements = getElementsInSlide();
    if (elements.length === 0) return;
    normalizeZIndices(elements);
    const ordered = elements.sort((a, b) => parseInt(a.style.zIndex, 10) - parseInt(b.style.zIndex, 10));
    const idx = ordered.indexOf(selectedElement);
    if (idx <= 0) return; // Already at bottom

    const prevEl = ordered[idx - 1];
    const zSel = selectedElement.style.zIndex;
    selectedElement.style.zIndex = prevEl.style.zIndex;
    prevEl.style.zIndex = zSel;

    saveElementState();
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Backdrop click disabled - only close button can close modal
    console.log('Backdrop clicked - ignoring (backdrop close disabled)');
  };



  const handleTextEdit = (element: HTMLElement, newText: string) => {
    console.log('=== TEXT EDIT START ===');

    try {
      // After user edits, rebuild entire slide HTML from DOM to ensure consistency
      const slideContentEl = document.querySelector('[data-slide-id="modal-editor"]');
      if (!slideContentEl) {
        console.error('Slide content element not found for saving!');
        return;
      }

      // Clone to avoid modifying live DOM while cleaning
      const cloned = slideContentEl.cloneNode(true) as HTMLElement;

      // Remove any handle elements that might still be present in the cloned DOM
      cloned.querySelectorAll('[data-handle-name], [data-handle-type], [data-element-id]').forEach(h => h.remove());

      // Serialize cleaned HTML
      const cleanHtml = cloned.innerHTML;

      if (cleanHtml === currentSlideHtml) {
        console.log('HTML unchanged after edit – skipping save');
        return;
      }

      setCurrentSlideHtml(cleanHtml);

      // Persist via onSave
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
              title="Add YouTube Video"
              onClick={handleAddYouTubeVideo}
            >
              Add Video
            </button>
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
              Save
            </button>
            <button 
              className={styles.toolButton} 
              title="Delete Selected (or press Delete key)"
              onClick={handleDeleteSelected}
            >
              Delete
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
            <button className={styles.toolButton} title="Duplicate Selected">
              Duplicate
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