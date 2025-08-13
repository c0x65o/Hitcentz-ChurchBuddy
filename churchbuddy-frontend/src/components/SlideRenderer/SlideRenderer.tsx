import React, { useRef, useEffect, useState } from 'react';
import { ISlide } from '../../types/ISlide';
import styles from './SlideRenderer.module.css';

interface SlideRendererProps {
  slide: ISlide;
  className?: string;
  editMode?: boolean;
  onTextEdit?: (element: HTMLElement, newText: string) => void;
  uniqueId?: string;
  disableScaling?: boolean;
  isActive?: boolean; // New prop to control video playback
  activeSlideId?: string; // New prop to determine if this slide is active
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className, editMode = false, onTextEdit, uniqueId, disableScaling = false, isActive = false, activeSlideId }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(0); // Start with 0 to prevent flash
  const [scale, setScale] = useState(1);
  const [fontSizeCalculated, setFontSizeCalculated] = useState(false); // Track if font size has been calculated

  // Apply background from HTML comment
  useEffect(() => {
    if (!containerRef.current) return;
    
    const commentRegex = /<!--BACKGROUND:(.*?)-->/i;
    const bgMatch = slide.html.match(commentRegex);
    const bgUrl = bgMatch ? bgMatch[1] : null;
    
    if (bgUrl) {
      containerRef.current.style.backgroundImage = `url(${bgUrl})`;
      containerRef.current.style.backgroundSize = 'cover';
      containerRef.current.style.backgroundPosition = 'center';
      containerRef.current.style.backgroundRepeat = 'no-repeat';
    } else {
      containerRef.current.style.backgroundImage = '';
      containerRef.current.style.backgroundSize = '';
      containerRef.current.style.backgroundPosition = '';
      containerRef.current.style.backgroundRepeat = '';
    }
  }, [slide.html]);

  // Video control based on isActive prop
  useEffect(() => {
    if (!containerRef.current) return;

    // Handle YouTube iframes (background videos)
    const youtubeIframes = containerRef.current.querySelectorAll('iframe[src*="youtube.com"]');
    
    youtubeIframes.forEach((iframe, index) => {
      const iframeElement = iframe as HTMLIFrameElement;
      
      if (isActive) {
        // When active, ensure autoplay and unmute
        if (iframeElement.src.includes('autoplay=0')) {
          iframeElement.src = iframeElement.src.replace('autoplay=0', 'autoplay=1');
        } else if (!iframeElement.src.includes('autoplay=1')) {
          const separator = iframeElement.src.includes('?') ? '&' : '?';
          iframeElement.src = `${iframeElement.src}${separator}autoplay=1`;
        }
        
        if (iframeElement.src.includes('mute=1')) {
          iframeElement.src = iframeElement.src.replace('mute=1', 'mute=0');
        } else if (!iframeElement.src.includes('mute=0')) {
          const separator = iframeElement.src.includes('?') ? '&' : '?';
          iframeElement.src = `${iframeElement.src}${separator}mute=0`;
        }
      } else {
        // When not active, pause by removing autoplay and adding mute
        if (iframeElement.src.includes('autoplay=1')) {
          iframeElement.src = iframeElement.src.replace('autoplay=1', 'autoplay=0');
        } else if (!iframeElement.src.includes('autoplay=0')) {
          const separator = iframeElement.src.includes('?') ? '&' : '?';
          iframeElement.src = `${iframeElement.src}${separator}autoplay=0`;
        }
        
        if (!iframeElement.src.includes('mute=1')) {
          const separator = iframeElement.src.includes('?') ? '&' : '?';
          iframeElement.src = `${iframeElement.src}${separator}mute=1`;
        }
      }
    });

         // Handle native video elements
     const videoElements = containerRef.current.querySelectorAll('video');
     videoElements.forEach((video) => {
       if (isActive) {
         // When active, unmute and play
         video.muted = false;
         video.play().catch((error) => {
           // Silent fail for video control
         });
       } else {
         // When not active, pause
         video.pause();
       }
     });
   }, [isActive, slide.html]);

  // Separate useEffect for edit mode
  useEffect(() => {
    if (!editMode || !contentRef.current || fontSize === 0) return; // Wait for font size to be calculated

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (!contentRef.current) return;

      const allElements = contentRef.current.querySelectorAll('h1, h2, h3, p, div, img, iframe');
      const cleanupFunctions: (() => void)[] = [];

      // Clean up any stray handles from previous interactions within this container
      const staleHandles = containerRef.current?.querySelectorAll('.resize-handle');
      console.log('🧹 Cleaning up stale handles:', staleHandles?.length || 0);
      staleHandles?.forEach(handle => {
        const handleElement = handle as HTMLElement;
        console.log('  - Removing handle:', handleElement.dataset.elementId, handleElement.dataset.handleName);
        handle.remove();
      });

      allElements.forEach((htmlElement) => {
        if (!(htmlElement instanceof HTMLElement)) return;

        // Always process elements to ensure event listeners are attached
        // Remove any existing processed flag to allow re-processing
        delete htmlElement.dataset.processed;

        // Create handles for this element
        const allHandles: HTMLElement[] = [];
        
        // Ensure a stable elementId we can use to manage handles reliably
        const elementId = htmlElement.dataset.elementId || `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        htmlElement.dataset.elementId = elementId;
        console.log('🔧 Creating handles for element:', elementId, 'tag:', htmlElement.tagName);

        // Create corner handles (squares)
        const cornerHandles = [
          { name: 'corner-tl', type: 'resize', width: '8px', height: '8px', cursor: 'nw-resize' },
          { name: 'corner-tr', type: 'resize', width: '8px', height: '8px', cursor: 'ne-resize' },
          { name: 'corner-bl', type: 'resize', width: '8px', height: '8px', cursor: 'sw-resize' },
          { name: 'corner-br', type: 'resize', width: '8px', height: '8px', cursor: 'se-resize' }
        ];

        cornerHandles.forEach((pos) => {
            const handle = document.createElement('div');
            console.log('    + Creating corner handle:', pos.name, 'for element:', elementId);
            handle.className = 'resize-handle';
            handle.dataset.elementId = elementId;
            handle.style.position = 'absolute';
            // Initial positioning will be set by adjustHandlePositions()
            handle.style.top = '0px';
            handle.style.left = '0px';
            handle.style.width = pos.width;
            handle.style.height = pos.height;
            handle.style.background = 'var(--color-accent-primary)';
            handle.style.border = '1px solid rgba(255,255,255,0.9)';
            handle.style.borderRadius = '2px';
            handle.style.cursor = pos.cursor;
            handle.style.opacity = '0';
            handle.style.transition = 'transform 0.12s ease';
            handle.style.display = 'none';
            handle.style.zIndex = '10';
            handle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            handle.contentEditable = 'false';
            handle.style.userSelect = 'none';
            handle.style.pointerEvents = 'auto';
            handle.setAttribute('contenteditable', 'false');
            handle.setAttribute('unselectable', 'on');
          handle.dataset.handleName = pos.name;
          handle.dataset.handleType = pos.type;
          
          allHandles.push(handle);
          // Attach ALL handles to container so they stay visible when element is clipped
          if (containerRef.current) {
            containerRef.current.appendChild(handle);
          } else {
            // Fallback to htmlElement if containerRef.current is not available
            htmlElement.appendChild(handle);
          }

          // Enable resizing from corner handles
          handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            // Map corner names to simpler codes used in movement logic
            const map: Record<string, 'nw' | 'ne' | 'sw' | 'se'> = {
              'corner-tl': 'nw',
              'corner-tr': 'ne',
              'corner-bl': 'sw',
              'corner-br': 'se'
            };
            resizeHandle = map[pos.name];
            handleDragStart(e as unknown as MouseEvent);
          });
        });
        
        // Create edge handles (bars)
        const edgeHandles = [
          { name: 'edge-top', type: 'resize', width: '8px', height: '4px', cursor: 'n-resize' },
          { name: 'edge-bottom', type: 'resize', width: '8px', height: '4px', cursor: 's-resize' },
          { name: 'edge-left', type: 'resize', width: '4px', height: '8px', cursor: 'w-resize' },
          { name: 'edge-right', type: 'resize', width: '4px', height: '8px', cursor: 'e-resize' }
        ];

        edgeHandles.forEach((pos) => {
          const handle = document.createElement('div');
          console.log('    + Creating edge handle:', pos.name, 'for element:', elementId);
          handle.className = 'resize-handle';
          handle.dataset.elementId = elementId;
          handle.style.position = 'absolute';
          // Initial positioning will be set by adjustHandlePositions()
          handle.style.top = '0px';
          handle.style.left = '0px';
          handle.style.width = pos.width;
          handle.style.height = pos.height;
          handle.style.background = 'var(--color-accent-primary)';
          handle.style.border = '1px solid rgba(255,255,255,0.9)';
          handle.style.borderRadius = '3px';
          handle.style.cursor = pos.cursor;
          handle.style.opacity = '0';
          handle.style.transition = 'opacity 0.2s ease';
          handle.style.display = 'none';
          handle.style.zIndex = '9';
          handle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          handle.contentEditable = 'false';
          handle.style.userSelect = 'none';
          handle.style.pointerEvents = 'auto';
          handle.setAttribute('contenteditable', 'false');
          handle.setAttribute('unselectable', 'on');
          handle.dataset.handleName = pos.name;
          handle.dataset.handleType = pos.type;
          
          allHandles.push(handle);
          // Attach ALL handles to container so they stay visible when element is clipped
          if (containerRef.current) {
            containerRef.current.appendChild(handle);
          } else {
            // Fallback to htmlElement if containerRef.current is not available
            htmlElement.appendChild(handle);
          }

          // Enable resizing from edge handles
          handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            const map: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
              'edge-top': 'top',
              'edge-bottom': 'bottom',
              'edge-left': 'left',
              'edge-right': 'right'
            };
            // @ts-ignore - union with corner codes handled in move logic
            resizeHandle = map[pos.name];
            handleDragStart(e as unknown as MouseEvent);
          });
        });
        
        // DRAG HANDLE COMMENTED OUT - STARTING FRESH
        /*
        // Create drag handle (bottom center with icon) - clean rectangular design
        const dragHandle = document.createElement('div');
        dragHandle.style.position = 'absolute';
        dragHandle.style.bottom = '-35px';
        dragHandle.style.left = '0px';
        dragHandle.style.transform = 'translateX(-100px)'; // Increased from -80px to -100px
        dragHandle.style.width = '60px';
        dragHandle.style.height = '24px';
        dragHandle.style.background = '#22c55e';
        dragHandle.style.border = '2px solid white';
        dragHandle.style.borderRadius = '12px';
        dragHandle.style.cursor = 'move';
        dragHandle.style.opacity = '0';
        dragHandle.style.transition = 'opacity 0.2s ease';
        dragHandle.style.display = 'none';
        dragHandle.style.zIndex = '1001';
        dragHandle.style.display = 'flex';
        dragHandle.style.alignItems = 'center';
        dragHandle.style.justifyContent = 'center';
        dragHandle.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        dragHandle.innerHTML = 'DRAG';
        dragHandle.style.fontSize = '10px';
        dragHandle.style.color = 'white';
        dragHandle.style.fontWeight = '600';
        dragHandle.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        dragHandle.style.letterSpacing = '0.5px';
        dragHandle.style.textAlign = 'center';
        dragHandle.style.lineHeight = '24px';
        dragHandle.style.verticalAlign = 'middle';
        dragHandle.contentEditable = 'false';
        dragHandle.style.userSelect = 'none';
        dragHandle.style.pointerEvents = 'auto';
        dragHandle.setAttribute('contenteditable', 'false');
        dragHandle.setAttribute('unselectable', 'on');
        dragHandle.dataset.handleName = 'drag';
        dragHandle.dataset.handleType = 'drag';
        dragHandle.dataset.elementId = htmlElement.id;
        
        allHandles.push(dragHandle);
        // Append to container (outside stage) so handles can appear outside slide bounds
        if (containerRef.current) {
          containerRef.current.appendChild(dragHandle);
        } else {
          htmlElement.appendChild(dragHandle);
        }
        */
        
        // Create rotate button (next to drag handle) - clean rectangular design
        const rotateButton = document.createElement('div');
        rotateButton.style.position = 'absolute';
        rotateButton.style.bottom = '-35px';
        rotateButton.style.right = '0px';
        rotateButton.style.transform = 'translateX(100px)'; // Increased from 80px to 100px
        rotateButton.style.width = '70px';
        rotateButton.style.height = '24px';
        rotateButton.style.background = '#a855f7';
        rotateButton.style.border = '2px solid white';
        rotateButton.style.borderRadius = '12px';
        rotateButton.style.cursor = 'pointer';
        rotateButton.style.opacity = '0';
        rotateButton.style.transition = 'opacity 0.2s ease';
        rotateButton.style.display = 'none';
        rotateButton.style.zIndex = '11';
        rotateButton.style.display = 'flex';
        rotateButton.style.alignItems = 'center';
        rotateButton.style.justifyContent = 'center';
        rotateButton.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        rotateButton.innerHTML = 'ROTATE';
        rotateButton.style.fontSize = '10px';
        rotateButton.style.color = 'white';
        rotateButton.style.fontWeight = '600';
        rotateButton.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        rotateButton.style.letterSpacing = '0.5px';
        rotateButton.style.textAlign = 'center';
        rotateButton.style.lineHeight = '24px';
        rotateButton.style.verticalAlign = 'middle';
        rotateButton.contentEditable = 'false';
        rotateButton.style.userSelect = 'none';
        rotateButton.style.pointerEvents = 'auto';
        rotateButton.setAttribute('contenteditable', 'false');
        rotateButton.setAttribute('unselectable', 'on');
        rotateButton.dataset.handleName = 'rotate';
        rotateButton.dataset.handleType = 'rotate';
        rotateButton.dataset.elementId = htmlElement.id;
        
        allHandles.push(rotateButton);
        // Append to container (outside stage) so handles can appear outside slide bounds
        if (containerRef.current) {
          containerRef.current.appendChild(rotateButton);
        } else {
          htmlElement.appendChild(rotateButton);
        }
        
        // Function to position ALL handles relative to container (Canva-style)
        const adjustHandlePositions = () => {
          const elementRect = htmlElement.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          
          if (!containerRect) return;
          
          // Get element position relative to container
          const containerOffsetLeft = containerRect.left;
          const containerOffsetTop = containerRect.top;
          const elementLeft = elementRect.left - containerOffsetLeft;
          const elementTop = elementRect.top - containerOffsetTop;
          const elementWidth = elementRect.width;
          const elementHeight = elementRect.height;
          const elementCenterX = elementLeft + elementWidth / 2;
          const elementCenterY = elementTop + elementHeight / 2;
          
          // Get current rotation of the element
          const currentTransform = htmlElement.style.transform || '';
          const rotateMatch = currentTransform.match(/rotate\((\d+)deg\)/);
          const currentRotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
          
          // Position corner handles with rotation
          const cornerPositions = [
            { handle: allHandles.find(h => h.dataset.handleName === 'corner-tl'), x: elementLeft - 8, y: elementTop - 8 },
            { handle: allHandles.find(h => h.dataset.handleName === 'corner-tr'), x: elementLeft + elementWidth - 4, y: elementTop - 8 },
            { handle: allHandles.find(h => h.dataset.handleName === 'corner-bl'), x: elementLeft - 8, y: elementTop + elementHeight - 4 },
            { handle: allHandles.find(h => h.dataset.handleName === 'corner-br'), x: elementLeft + elementWidth - 4, y: elementTop + elementHeight - 4 }
          ];
          
          cornerPositions.forEach(pos => {
            if (pos.handle) {
              pos.handle.style.position = 'absolute';
              pos.handle.style.left = `${pos.x}px`;
              pos.handle.style.top = `${pos.y}px`;
              pos.handle.style.right = 'auto';
              pos.handle.style.bottom = 'auto';
              pos.handle.style.transform = `rotate(${currentRotation}deg)`;
            }
          });
          
          // Position edge handles with rotation
          const edgePositions = [
            { handle: allHandles.find(h => h.dataset.handleName === 'edge-top'), x: elementCenterX, y: elementTop - 4 },
            { handle: allHandles.find(h => h.dataset.handleName === 'edge-bottom'), x: elementCenterX, y: elementTop + elementHeight - 4 },
            { handle: allHandles.find(h => h.dataset.handleName === 'edge-left'), x: elementLeft - 4, y: elementCenterY },
            { handle: allHandles.find(h => h.dataset.handleName === 'edge-right'), x: elementLeft + elementWidth - 4, y: elementCenterY }
          ];
          
          edgePositions.forEach(pos => {
            if (pos.handle) {
              pos.handle.style.position = 'absolute';
              pos.handle.style.left = `${pos.x}px`;
              pos.handle.style.top = `${pos.y}px`;
              pos.handle.style.right = 'auto';
              pos.handle.style.bottom = 'auto';
              pos.handle.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
            }
          });
          
          // DRAG HANDLE POSITIONING COMMENTED OUT - STARTING FRESH
          /*
          // Position drag handle directly below element, left side
          let dragX = elementLeft;
          let dragY = elementTop + elementHeight + 10;
          
          // Move to top if no room at bottom
          if (dragY > containerRect.height - 20) {
            dragY = elementTop - 40;
          }
          
          // Ensure drag handle doesn't go off left edge
          if (dragX < 20) {
            dragX = 20;
          }
          
          dragHandle.style.position = 'absolute';
          dragHandle.style.left = `${dragX}px`;
          dragHandle.style.top = `${dragY}px`;
          dragHandle.style.bottom = 'auto';
          dragHandle.style.transform = 'none';
          */
          
          // Position rotate button directly below element, right side
          let rotateX = elementLeft + elementWidth - 120; // Increased from 90px to 120px for more spacing
          let rotateY = elementTop + elementHeight + 10; // Use element position instead of dragY
          
          // Ensure rotate button doesn't go off right edge
          if (rotateX > containerRect.width - 20) {
            rotateX = containerRect.width - 20;
          }
          
          rotateButton.style.position = 'absolute';
          rotateButton.style.left = `${rotateX}px`;
          rotateButton.style.top = `${rotateY}px`;
          rotateButton.style.bottom = 'auto';
          rotateButton.style.transform = 'none';
        };
        
        // Initial positioning of all handles
        adjustHandlePositions();
        
        // Set up interaction handlers
        // DRAG VARIABLES COMMENTED OUT - STARTING FRESH
        /*
        let isDragging = false;
        let isResizing = false;
        let currentHandle: HTMLElement | null = null;
        let dragStartX = 0;
        let dragStartY = 0;
        let originalX = 0;
        let originalY = 0;
        let originalWidth = 0;
        let originalHeight = 0;
        let originalTransform = '';
        */
        
        // DRAG INTERACTION HANDLERS COMMENTED OUT - STARTING FRESH
        /*
        const handleInteractionStart = (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          
          const target = e.target as HTMLElement;
          const handleName = target.dataset.handleName;
          const handleType = target.dataset.handleType;
          
          console.log('Interaction start:', handleName, handleType);
          
          if (handleType === 'drag') {
            isDragging = true;
            currentHandle = target;
            
            // Get container bounds for coordinate conversion
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return;
            
            // Get element position relative to container
            const elementRect = htmlElement.getBoundingClientRect();
            const elementLeft = elementRect.left - containerRect.left;
            const elementTop = elementRect.top - containerRect.top;
            
            // Convert to percentages for positioning
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            originalX = (elementLeft / containerWidth) * 100;
            originalY = (elementTop / containerHeight) * 100;
            
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            originalTransform = htmlElement.style.transform || '';
            
            document.addEventListener('mousemove', handleInteractionMove);
            document.addEventListener('mouseup', handleInteractionEnd);
          } else if (handleType === 'resize') {
            isResizing = true;
            currentHandle = target;
            const rect = htmlElement.getBoundingClientRect();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            originalWidth = rect.width;
            originalHeight = rect.height;
            originalX = rect.left;
            originalY = rect.top;
            originalTransform = htmlElement.style.transform || '';
            
            document.addEventListener('mousemove', handleInteractionMove);
            document.addEventListener('mouseup', handleInteractionEnd);
          } else if (handleType === 'rotate') {
            // Handle rotation
            const currentRotation = getCurrentRotation(htmlElement);
            const newRotation = (currentRotation + 90) % 360;
            htmlElement.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
            adjustHandlePositions();
          }
        };
        */
        
        const getCurrentRotation = (element: HTMLElement): number => {
          const transform = element.style.transform || '';
          const match = transform.match(/rotate\((\d+)deg\)/);
          return match ? parseFloat(match[1]) : 0;
        };
        
        const handleRotate = () => {
          const currentRotation = getCurrentRotation(htmlElement);
          const newRotation = (currentRotation + 90) % 360;
          htmlElement.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
          adjustHandlePositions();
        };
        
        // DRAG MOVE HANDLER COMMENTED OUT - STARTING FRESH
        /*
        const handleInteractionMove = (e: MouseEvent) => {
          if (!isDragging && !isResizing) return;
          
          e.preventDefault();
          
          // Calculate deltas for both drag and resize operations
          const deltaX = e.clientX - dragStartX;
          const deltaY = e.clientY - dragStartY;
          
          if (isDragging) {
            // Get container bounds for coordinate conversion
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (!containerRect) return;
            
            // Calculate new position using percentage-based coordinates
            // Convert delta to percentage
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            const deltaXPercent = (deltaX / containerWidth) * 100;
            const deltaYPercent = (deltaY / containerHeight) * 100;
            
            const newX = originalX + deltaXPercent;
            const newY = originalY + deltaYPercent;
            
            // Apply new position using percentages and preserve transform
            htmlElement.style.position = 'absolute';
            htmlElement.style.left = `${newX}%`;
            htmlElement.style.top = `${newY}%`;
            htmlElement.style.transform = originalTransform;
            
            // Update handle positions
            adjustHandlePositions();
          } else if (isResizing) {
            // Handle resizing based on which handle is being dragged
            const handleName = currentHandle?.dataset.handleName;
            
            if (handleName?.includes('corner-br')) {
              // Bottom-right corner - resize width and height
              const newWidth = Math.max(50, originalWidth + deltaX);
              const newHeight = Math.max(50, originalHeight + deltaY);
              
              htmlElement.style.width = `${newWidth}px`;
              htmlElement.style.height = `${newHeight}px`;
            } else if (handleName?.includes('corner-bl')) {
              // Bottom-left corner - resize width and height, adjust X
              const newWidth = Math.max(50, originalWidth - deltaX);
              const newHeight = Math.max(50, originalHeight + deltaY);
              const newX = originalX + deltaX;
              
              htmlElement.style.width = `${newWidth}px`;
              htmlElement.style.height = `${newHeight}px`;
              htmlElement.style.left = `${newX}px`;
            } else if (handleName?.includes('corner-tr')) {
              // Top-right corner - resize width and height, adjust Y
              const newWidth = Math.max(50, originalWidth + deltaX);
              const newHeight = Math.max(50, originalHeight - deltaY);
              const newY = originalY + deltaY;
              
              htmlElement.style.width = `${newWidth}px`;
              htmlElement.style.height = `${newHeight}px`;
              htmlElement.style.top = `${newY}px`;
            } else if (handleName?.includes('corner-tl')) {
              // Top-left corner - resize width and height, adjust X and Y
              const newWidth = Math.max(50, originalWidth - deltaX);
              const newHeight = Math.max(50, originalHeight - deltaY);
              const newX = originalX + deltaX;
              const newY = originalY + deltaY;
              
              htmlElement.style.width = `${newWidth}px`;
              htmlElement.style.height = `${newHeight}px`;
              htmlElement.style.left = `${newX}px`;
              htmlElement.style.top = `${newY}px`;
            }
            
            // Update handle positions
            adjustHandlePositions();
          }
        };
        */
        
        // DRAG END HANDLER COMMENTED OUT - STARTING FRESH
        /*
        const handleInteractionEnd = () => {
          isDragging = false;
          isResizing = false;
          currentHandle = null;
          
          document.removeEventListener('mousemove', handleInteractionMove);
          document.removeEventListener('mouseup', handleInteractionEnd);
        };
        */
        
        // Double-click handler for text editing
        const handleDoubleClick = (e: Event) => {
          if (!editMode) return;
          
          e.stopPropagation();
          e.preventDefault();
          
          // Make text elements editable on double-click
          if (htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$/)) {
            htmlElement.contentEditable = 'true';
            htmlElement.focus();
            // Enable natural text interaction while editing
            htmlElement.style.userSelect = 'text';
            htmlElement.style.cursor = 'text';
            htmlElement.dataset.isEditing = 'true';
            
            // Place caret at the end so a single Enter creates a new line
            const range = document.createRange();
            range.selectNodeContents(htmlElement);
            range.collapse(false);
            // If element is empty, insert a zero-width space so Enter works immediately
            if (htmlElement.innerHTML === '' || htmlElement.innerHTML === '<br>') {
              htmlElement.innerHTML = '\u200B';
              range.selectNodeContents(htmlElement);
              range.collapse(false);
            }
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            // Add keydown handler for Enter key to auto-expand
            const handleKeyDown = (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                console.log('⌨️ Enter key pressed in element:', htmlElement.dataset.elementId);
                console.log('  - Before Enter - HTML:', htmlElement.innerHTML);
                console.log('  - Before Enter - Height:', htmlElement.style.height, 'scrollHeight:', htmlElement.scrollHeight);
                e.preventDefault();
                e.stopPropagation();
                
                // Get current selection
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                
                const range = selection.getRangeAt(0);
                console.log('  - Selection range:', range.startOffset, 'to', range.endOffset);
                
                // Insert a line break at the cursor position
                const br = document.createElement('br');
                range.deleteContents();
                range.insertNode(br);
                
                // Move cursor after the line break and insert a zero-width space on the new line
                const afterBrRange = document.createRange();
                afterBrRange.setStartAfter(br);
                afterBrRange.collapse(true);
                const zwsp = document.createTextNode('\u200B');
                afterBrRange.insertNode(zwsp);
                const caretRange = document.createRange();
                caretRange.setStartAfter(zwsp);
                caretRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(caretRange);
                
                // Auto-expand the text box height to fit
                htmlElement.style.height = 'auto';
                htmlElement.style.height = `${htmlElement.scrollHeight}px`;
                console.log('  - After Enter - HTML:', htmlElement.innerHTML);
                console.log('  - After Enter - Height:', htmlElement.style.height, 'scrollHeight:', htmlElement.scrollHeight);
 
                // Update handle positions after growth
                try { adjustHandlePositions(); updateHandleVisibility(); } catch {}
              }
            };

            // Also handle legacy keypress for some browsers so first press is captured
            const handleKeyPress = (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleKeyDown(e);
              }
            };
            
            // Add the keydown event listener
            htmlElement.addEventListener('keydown', handleKeyDown);
            htmlElement.addEventListener('keypress', handleKeyPress);
            
            // Store the handler for cleanup
            htmlElement.dataset.keydownHandler = 'true';

            // Auto-size on input changes and keep handles in sync
            const handleInput = () => {
              htmlElement.style.height = 'auto';
              htmlElement.style.height = `${htmlElement.scrollHeight}px`;
              try { adjustHandlePositions(); updateHandleVisibility(); } catch {}
            };
            htmlElement.addEventListener('input', handleInput);
            cleanupFunctions.push(() => htmlElement.removeEventListener('input', handleInput));
          }
        };
        
        // Simple click handler for drag selection
        const handleTextClick = (e: Event) => {
          if (!editMode) return;
          
          // If already editing, allow normal click to set caret
          if (htmlElement.isContentEditable) {
            return;
          }
          e.stopPropagation();
          e.preventDefault();
          
          // Select this element for toolbar editing
          const allElements = document.querySelectorAll('[data-slide-id="modal-editor"] h1, [data-slide-id="modal-editor"] h2, [data-slide-id="modal-editor"] h3, [data-slide-id="modal-editor"] p, [data-slide-id="modal-editor"] div');
          allElements.forEach(el => {
            el.classList.remove('selected');
          });
                      htmlElement.classList.add('selected');
          
          // Don't make editable on single click - only on double-click
          // This allows for drag selection without accidentally entering edit mode
        };
        
        // Drag functionality for edit mode
        let isDragging = false;
        let isResizing = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let originalLeft = 0;
        let originalTop = 0;
        let originalWidth = 0;
        let originalHeight = 0;
        let resizeHandle = '';
        
        const handleDragStart = (e: MouseEvent) => {
          if (!editMode) return;
          if (htmlElement.isContentEditable) return; // Do not start drag when editing
          
          e.stopPropagation();
          e.preventDefault();
          
          // Get current computed position
          const computedStyle = window.getComputedStyle(htmlElement);
          originalLeft = parseFloat(computedStyle.left) || 0;
          originalTop = parseFloat(computedStyle.top) || 0;
          originalWidth = parseFloat(computedStyle.width) || htmlElement.offsetWidth;
          originalHeight = parseFloat(computedStyle.height) || htmlElement.offsetHeight;
          
          isDragging = true;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          
          // Set cursor
          htmlElement.style.cursor = 'grabbing';
          
          // Add dragging class
          htmlElement.classList.add('dragging');
          
          // Prevent text selection during drag
          document.body.style.userSelect = 'none';
          // Disable pointer events on iframes/videos while dragging to avoid capture
          const iframes = containerRef.current?.querySelectorAll('iframe, video') || [];
          iframes.forEach(el => ((el as HTMLElement).style.pointerEvents = 'none'));
          
          // Hide all resize handles while dragging to avoid leaving ghost squares
          const allHandles = containerRef.current?.querySelectorAll('.resize-handle');
          console.log('👻 Hiding handles during drag:', allHandles?.length || 0);
          allHandles?.forEach(h => { 
            const handleElement = h as HTMLElement;
            handleElement.style.opacity = '0'; 
            console.log('  - Hidden handle:', handleElement.dataset.elementId, handleElement.dataset.handleName);
          });
        };
        
        const handleDragMove = (e: MouseEvent) => {
          if (!isDragging || !editMode) return;
          
          e.preventDefault();
          
          // Compensate for stage scale so movement matches cursor speed
          const scaleForPointer = scale || 1;
          const deltaX = (e.clientX - dragStartX) / scaleForPointer;
          const deltaY = (e.clientY - dragStartY) / scaleForPointer;
          
          if (isResizing) {
            // Handle resize based on which handle is being dragged
            let newWidth = originalWidth;
            let newHeight = originalHeight;
            
            if (resizeHandle === 'se' || resizeHandle === 'ne') {
              newWidth = originalWidth + deltaX;
            } else if (resizeHandle === 'sw' || resizeHandle === 'nw') {
              newWidth = originalWidth - deltaX;
            }
            
            if (resizeHandle === 'se' || resizeHandle === 'sw') {
              newHeight = originalHeight + deltaY;
            } else if (resizeHandle === 'ne' || resizeHandle === 'nw') {
              newHeight = originalHeight - deltaY;
            }

            // Edge-only resizing (left/right/top/bottom)
            if (resizeHandle === 'right') {
              newWidth = originalWidth + deltaX;
            } else if (resizeHandle === 'left') {
              newWidth = originalWidth - deltaX;
              const adjLeft = originalLeft + deltaX;
              htmlElement.style.left = `${adjLeft}px`;
            }
            if (resizeHandle === 'bottom') {
              newHeight = originalHeight + deltaY;
            } else if (resizeHandle === 'top') {
              newHeight = originalHeight - deltaY;
              const adjTop = originalTop + deltaY;
              htmlElement.style.top = `${adjTop}px`;
            }
            
            // Minimum size constraints
            const minSize = 50;
            const finalWidth = Math.max(newWidth, minSize);
            const finalHeight = Math.max(newHeight, minSize);
            
                    // For images, set both style and attributes
                  if (htmlElement.tagName === 'IMG') {
            const imgElement = htmlElement as HTMLImageElement;
          
          imgElement.width = finalWidth;
          imgElement.height = finalHeight;
          imgElement.style.width = `${finalWidth}px`;
          imgElement.style.height = `${finalHeight}px`;
          imgElement.style.setProperty('width', `${finalWidth}px`, 'important');
          imgElement.style.setProperty('height', `${finalHeight}px`, 'important');
          
          // Only remove max-width/max-height constraints if the image has been manually resized
          // This prevents the initial size constraints from being removed when the image is first added
          const hasBeenResized = imgElement.dataset.hasBeenResized === 'true';
          const isNewlyAdded = imgElement.dataset.newlyAdded === 'true';
          
                      // Don't remove size constraints for newly added images, even during resize operations
            if (!isNewlyAdded && hasBeenResized) {
              imgElement.style.setProperty('max-width', 'none', 'important');
              imgElement.style.setProperty('max-height', 'none', 'important');
              imgElement.style.setProperty('object-fit', 'fill', 'important');
            }
        } else {
          htmlElement.style.width = `${finalWidth}px`;
          htmlElement.style.height = `${finalHeight}px`;
        }
            
            console.log('Resizing element:', htmlElement.tagName, 'to:', finalWidth, 'x', finalHeight);
          } else {
            // Handle drag
            const newLeft = originalLeft + deltaX;
            const newTop = originalTop + deltaY;
            
            htmlElement.style.left = `${newLeft}px`;
            htmlElement.style.top = `${newTop}px`;
            htmlElement.style.position = 'absolute';
          }
        };
        
        const handleDragEnd = () => {
          if (!isDragging) return;
          
          isDragging = false;
          isResizing = false;
          htmlElement.style.cursor = 'grab';
          htmlElement.classList.remove('dragging');
          document.body.style.userSelect = '';
          const iframes = containerRef.current?.querySelectorAll('iframe, video') || [];
          iframes.forEach(el => ((el as HTMLElement).style.pointerEvents = 'auto'));
          // Reposition handles for this element and show only for selection
          adjustHandlePositions();
          updateHandleVisibility();
          
          // For images, store the final dimensions as data attributes
          if (htmlElement.tagName === 'IMG' && isResizing) {
            const finalWidth = htmlElement.style.width;
            const finalHeight = htmlElement.style.height;
            htmlElement.dataset.finalWidth = finalWidth;
            htmlElement.dataset.finalHeight = finalHeight;
            htmlElement.dataset.hasBeenResized = 'true';
          }
          
          // Save the new position/size
          if (onTextEdit) {
            // For images, don't change the content, just trigger a save
            if (htmlElement.tagName === 'IMG') {
              // For images, preserve the alt text and trigger save without changing content
              const altText = (htmlElement as HTMLImageElement).alt || '';
              onTextEdit(htmlElement, altText);
            } else {
              // For text elements, save the HTML content to preserve formatting
              const newText = htmlElement.innerHTML || '';
              onTextEdit(htmlElement, newText);
            }
          }
        };
        
        // Create resize handles (stable IDs, small blue, no duplicates)
        const createResizeHandles = () => {
          // Using initial per-element handles; skip duplicate creation
          console.log('↩️ Skipping duplicate createResizeHandles (handled by initial handles)');
          return;
        };
        
        // Show/hide resize handles based on selection
        const updateResizeHandles = () => {
          // Only query handles within the current container to avoid affecting other slides
          const allHandlesInContainer = containerRef.current?.querySelectorAll('.resize-handle');
          if (!allHandlesInContainer) return;

          allHandlesInContainer.forEach(handle => {
            (handle as HTMLElement).style.display = 'none';
            (handle as HTMLElement).style.opacity = '0';
          });

          // Show handles only for selected elements
          const allElements = document.querySelectorAll('[data-slide-id="modal-editor"] .selected');
          allElements.forEach(element => {
            // Find handles for this element by matching data attributes
            const elementHandles = containerRef.current?.querySelectorAll(`.resize-handle[data-element-id="${(element as HTMLElement).dataset.elementId}"]`);
            if (elementHandles) {
              elementHandles.forEach(handle => {
                (handle as HTMLElement).style.display = 'block';
                (handle as HTMLElement).style.opacity = '1';
              });
            }
          });
        };
        
        // Also handle mousedown to ensure click is captured
        const handleMouseDown = (e: Event) => {
          e.stopPropagation();
          // Do not process mousedown for drag/select while editing so caret can be set
          if (htmlElement.isContentEditable) {
            return;
          }
          
          // Remove newlyAdded flag when image is interacted with
          if (htmlElement.tagName === 'IMG' && htmlElement.dataset.newlyAdded === 'true') {
            htmlElement.dataset.newlyAdded = 'false';
            
            // Create resize handles for the image now that it's been interacted with
            setTimeout(() => {
              createResizeHandles();
            }, 100);
          }
          
          // Select this element for toolbar editing
          if (editMode) {
            // Only deselect elements within the current slide's editor area
            const editorElements = containerRef.current?.querySelectorAll('h1, h2, h3, p, div, img');
            editorElements?.forEach(el => {
              el.classList.remove('selected');
            });
            htmlElement.classList.add('selected');
            
            // Update handle visibility after selection
            setTimeout(() => {
              updateHandleVisibility();
            }, 10);
          }
          
          // Start drag if in edit mode
          if (editMode && htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$|^IMG$/)) {
            handleDragStart(e as MouseEvent);
          }
        };
        
                // Simple blur handler to save changes
        const handleBlur = () => {
          try {
            htmlElement.contentEditable = 'false';
            htmlElement.dataset.isEditing = 'false';
            // Restore edit-mode interaction defaults
            htmlElement.style.userSelect = 'none';
            htmlElement.style.cursor = 'grab';
            
            if (onTextEdit) {
              // Use innerHTML to preserve line breaks and formatting
              const newText = htmlElement.innerHTML || '';
              onTextEdit(htmlElement, newText);
            }
          } catch (error) {
            // Silent fail for text editing
          }
        };
        
        // Handle visibility based on selection
        const updateHandleVisibility = () => {
          // Hide all handles first, but only those within the current container
          const allHandles = containerRef.current?.querySelectorAll('.resize-handle');
          console.log('👁️ updateHandleVisibility - hiding all handles:', allHandles?.length || 0);
          allHandles?.forEach(handle => {
            (handle as HTMLElement).style.display = 'none';
            (handle as HTMLElement).style.opacity = '0';
          });
          
          // Show handles only for selected elements (selected within this editor instance)
          const selectedElement = containerRef.current?.querySelector('.selected');
          if (selectedElement) {
            const elementHandles = containerRef.current?.querySelectorAll(`.resize-handle[data-element-id="${(selectedElement as HTMLElement).dataset.elementId}"]`);
            console.log('👁️ Showing handles for selected element:', (selectedElement as HTMLElement).dataset.elementId, 'found handles:', elementHandles?.length || 0);
            if (elementHandles) {
              elementHandles.forEach(handle => {
                (handle as HTMLElement).style.display = 'block';
                (handle as HTMLElement).style.opacity = '1';
              });
            }
          } else {
            console.log('👁️ No selected element found');
          }
        };
        
        // Simple hover effects
        const handleMouseEnter = () => {
          // No hover effects for now - keeping it simple
        };
        
        const handleMouseLeave = () => {
          // No hover effects for now - keeping it simple
        };

        // Debounced handle adjustment to avoid thrash during rapid typing
        let adjustTimer: number | null = null;
        const scheduleAdjust = () => {
          if (adjustTimer) window.clearTimeout(adjustTimer);
          adjustTimer = window.setTimeout(() => {
            try { adjustHandlePositions(); updateHandleVisibility(); } catch {}
            adjustTimer = null;
          }, 50);
        };

        // DRAG EVENT LISTENERS COMMENTED OUT - STARTING FRESH
        /*
        // Attach interaction handlers to all handles
                  allHandles.forEach(handle => {
            handle.addEventListener('mousedown', handleInteractionStart);
          });
        */

        // Attach editing to the text element and images
        htmlElement.addEventListener('click', handleTextClick);
        htmlElement.addEventListener('dblclick', handleDoubleClick);
        htmlElement.addEventListener('mousedown', handleMouseDown);
        htmlElement.addEventListener('blur', handleBlur);
        htmlElement.addEventListener('mouseenter', handleMouseEnter);
        htmlElement.addEventListener('mouseleave', handleMouseLeave);
        if (htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$/)) {
          htmlElement.addEventListener('input', scheduleAdjust);
          cleanupFunctions.push(() => htmlElement.removeEventListener('input', scheduleAdjust));
        }

        // Add global mouse event listeners for drag - these should still be on document for global drag operations
        const handleGlobalMouseMove = (e: MouseEvent) => {
          if (isDragging) {
            handleDragMove(e);
          }
        };
        
        const handleGlobalMouseUp = () => {
          if (isDragging) {
            handleDragEnd();
          }
        };
        
        document.addEventListener('mousemove', handleGlobalMouseMove);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        
        // Create resize handles for text elements and images
        if (editMode && htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$|^IMG$/)) {
          console.log('🎯 Initial handles already created for:', htmlElement.tagName, 'elementId:', htmlElement.dataset.elementId);
        }
        
        // Initial handle visibility - hide all handles initially
        if (editMode) {
          console.log('⏰ Setting initial handle visibility timeout for element:', htmlElement.dataset.elementId);
          setTimeout(() => {
            console.log('⏰ Executing initial handle visibility for element:', htmlElement.dataset.elementId);
            updateHandleVisibility();
          }, 50);
        }
        
        // Make sure text elements and images are clickable and draggable
        if (htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$|^IMG$/)) {
          htmlElement.style.cursor = editMode ? 'grab' : (htmlElement.tagName === 'IMG' ? 'pointer' : 'text');
          htmlElement.style.pointerEvents = 'auto';
          htmlElement.style.userSelect = editMode ? 'none' : (htmlElement.tagName === 'IMG' ? 'none' : 'text');
          
          // Add title attribute to indicate double-click for editing
          if (editMode) {
            htmlElement.title = htmlElement.tagName === 'IMG' ? 'Click to select, drag to move' : 'Double-click to edit text';
          }
          
          // Add text box styling for edit mode
          if (editMode) {
            htmlElement.style.position = 'absolute';
            htmlElement.style.minWidth = '100px';
            htmlElement.style.minHeight = '30px';
            htmlElement.style.padding = '8px';
            htmlElement.style.border = '1px dashed var(--color-primary)';
            htmlElement.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
            htmlElement.style.borderRadius = '4px';
          }
          
          // Handle image constraints and dimension restoration (always, not just in edit mode)
          if (htmlElement.tagName === 'IMG') {
            const imgElement = htmlElement as HTMLImageElement;
            const isNewlyAdded = imgElement.dataset.newlyAdded === 'true';
            const hasBeenResized = imgElement.dataset.hasBeenResized === 'true';
            // Soft cap huge images to reduce layout cost
            const naturalW = (imgElement as any).naturalWidth || 0;
            const naturalH = (imgElement as any).naturalHeight || 0;
            const maxW = 2048; const maxH = 2048;
            if (!hasBeenResized && (naturalW > maxW || naturalH > maxH)) {
              const ratio = Math.min(maxW / Math.max(naturalW, 1), maxH / Math.max(naturalH, 1));
              if (ratio > 0 && ratio < 1) {
                imgElement.style.width = Math.floor((naturalW || 1920) * ratio) + 'px';
                imgElement.style.height = 'auto';
              }
            }
            
            // Only remove constraints and restore dimensions if the image has been manually resized
            if (hasBeenResized && !isNewlyAdded) {
              // Remove size constraints
              htmlElement.style.maxWidth = 'none';
              htmlElement.style.maxHeight = 'none';
              htmlElement.style.objectFit = 'fill';
              htmlElement.style.setProperty('max-width', 'none', 'important');
              htmlElement.style.setProperty('max-height', 'none', 'important');
              htmlElement.style.setProperty('object-fit', 'fill', 'important');
              
              // Restore final dimensions if they were stored
              if (htmlElement.dataset.finalWidth && htmlElement.dataset.finalHeight) {
                htmlElement.style.width = htmlElement.dataset.finalWidth;
                htmlElement.style.height = htmlElement.dataset.finalHeight;
                htmlElement.style.setProperty('width', htmlElement.dataset.finalWidth, 'important');
                htmlElement.style.setProperty('height', htmlElement.dataset.finalHeight, 'important');
              }
            } else if (isNewlyAdded) {
              // For newly added images, preserve the initial constraints set by SlideEditorModal
              // and ensure no stored dimensions are applied
              
              // Clear any stored dimensions to prevent restoration
              delete htmlElement.dataset.finalWidth;
              delete htmlElement.dataset.finalHeight;
            } else {
              // For images that are not newly added but also haven't been resized
              // (e.g., images from previous sessions), preserve their current state
            }
          }
        }
        

        
        // No observer needed - keeping it simple
        
        // Simple iframe click handler (images now use the same handlers as text elements)
        if (htmlElement.tagName === 'IFRAME') {
          htmlElement.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
        
        // Simple cleanup function
        cleanupFunctions.push(() => {
          htmlElement.removeEventListener('click', handleTextClick);
          htmlElement.removeEventListener('dblclick', handleDoubleClick);
          htmlElement.removeEventListener('mousedown', handleMouseDown);
          htmlElement.removeEventListener('blur', handleBlur);
          htmlElement.removeEventListener('mouseenter', handleMouseEnter);
          htmlElement.removeEventListener('mouseleave', handleMouseLeave);
          
          // Remove keydown event listener if it was added
          if (htmlElement.dataset.keydownHandler) {
            htmlElement.removeEventListener('keydown', (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                // This is the same handler we added above
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0) return;
                
                const range = selection.getRangeAt(0);
                const currentNode = range.startContainer;
                
                if (currentNode.nodeType === Node.TEXT_NODE) {
                  const textNode = currentNode as Text;
                  const offset = range.startOffset;
                  
                  const beforeText = textNode.textContent?.substring(0, offset) || '';
                  const afterText = textNode.textContent?.substring(offset) || '';
                  
                  const beforeNode = document.createTextNode(beforeText);
                  const breakNode = document.createElement('br');
                  const afterNode = document.createTextNode(afterText);
                  
                  textNode.textContent = '';
                  textNode.parentNode?.insertBefore(beforeNode, textNode);
                  textNode.parentNode?.insertBefore(breakNode, textNode);
                  textNode.parentNode?.insertBefore(afterNode, textNode);
                  textNode.parentNode?.removeChild(textNode);
                  
                  const newRange = document.createRange();
                  newRange.setStart(afterNode, 0);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
              }
            });
            delete htmlElement.dataset.keydownHandler;
          }
          
          htmlElement.contentEditable = 'false';
          
          // Remove global event listeners (only if they were added by this instance)
          document.removeEventListener('mousemove', handleGlobalMouseMove);
          document.removeEventListener('mouseup', handleGlobalMouseUp);

          // Remove handles associated with this element
          const elementId = htmlElement.dataset.elementId;
          if (elementId) {
            const handlesToRemove = containerRef.current?.querySelectorAll(`.resize-handle[data-element-id="${elementId}"]`);
            handlesToRemove?.forEach(handle => handle.remove());
          }
          
        });
      });

      // Return cleanup function for this timeout
      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    }, 100); // 100ms delay

    // Return cleanup function for the timeout
    return () => {
      clearTimeout(timer);
    };
  }, [editMode, slide.html, onTextEdit, fontSize]); // Add fontSize dependency to ensure DOM is ready

  // Clear selection state when editMode changes
  useEffect(() => {
    if (!editMode && contentRef.current) {
      // Remove selection from all elements when leaving edit mode
      const allElements = contentRef.current.querySelectorAll('h1, h2, h3, p, div, img, iframe');
      allElements.forEach((el) => {
        (el as HTMLElement).classList.remove('selected');
        (el as HTMLElement).style.outline = 'none';
        (el as HTMLElement).contentEditable = 'false';
      });
      // Also hide all handles from the document body
      const allHandles = document.querySelectorAll('.resize-handle');
      allHandles.forEach(handle => handle.remove());
      console.log('Cleared all selection state - leaving edit mode');
    }
  }, [editMode]);

  // Calculate scale to fit container
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current || !stageRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      if (disableScaling) {
        // For grid items, scale to fit the container size
        const stageWidth = 1920;
        const stageHeight = 1080;
        const scaleX = containerRect.width / stageWidth;
        const scaleY = containerRect.height / stageHeight;
        // Use the smaller scale to ensure it fits in both dimensions
        const newScale = Math.min(scaleX, scaleY);
        setScale(newScale);
        return;
      }
      
      // Fixed stage size (1920x1080)
      const stageWidth = 1920;
      const stageHeight = 1080;
      
      // Scale to exactly fill the container (both width and height)
      const scaleX = containerRect.width / stageWidth;
      const scaleY = containerRect.height / stageHeight;
      // Since both stage and container are 16:9, scaleX and scaleY should be the same
      // Use scaleX to ensure we fill the width exactly
      const newScale = scaleX;
      

      

      
      setScale(newScale);
    };

    calculateScale();
    
    const handleResize = () => {
      calculateScale();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [disableScaling]);

  // Calculate font size for fixed 1920x1080 stage
  useEffect(() => {
    // Only calculate font size once when slide first loads, not during editing
    if (fontSizeCalculated) return;
    
    const calculateFontSize = () => {
      if (!contentRef.current) return;

      const content = contentRef.current;
      // Remove any inline font-size from slide HTML so wrapper sizing controls text
      const sanitizedHtml = slide.html.replace(/font-size\s*:\s*[^;"']+;?/gi, '');

      // Compute available area by subtracting wrapper (20px) and inner padding if present
      const wrapperPadding = 20; // .slideContent padding
      const paddingMatch = sanitizedHtml.match(/padding\s*:\s*(\d+)px/i);
      const innerPadding = paddingMatch ? parseInt(paddingMatch[1], 10) : 0;
      const totalPadding = wrapperPadding + innerPadding; // per side
      
      // Always use fixed 1920x1080 template size
      const availableWidth = 1920 - 2 * totalPadding;
      const availableHeight = 1080 - 2 * totalPadding; // symmetric padding top/bottom

      // Create a temporary element for accurate measurement
      const tempElement = document.createElement('div');
      tempElement.innerHTML = sanitizedHtml;
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.whiteSpace = 'normal'; // Allow line breaks at word boundaries
      tempElement.style.wordBreak = 'normal'; // Allow natural word breaking
      // Removed overflowWrap and fixed width to avoid mid-word breaks
      tempElement.style.maxWidth = `${availableWidth}px`;
      tempElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif';
      tempElement.style.lineHeight = '1.4';
      tempElement.style.color = 'white';
      tempElement.style.fontWeight = '600';
      tempElement.style.textAlign = 'center';
      tempElement.style.boxSizing = 'border-box';
      document.body.appendChild(tempElement);

      // Binary search for the optimal font size
      let minSize = 8;  // Minimum readable size
      let maxSize = 80; // Maximum reasonable size
      let optimalSize = minSize;

      const testFontSize = (size: number): boolean => {
        tempElement.style.fontSize = `${size}px`;
        // Use scrollWidth/scrollHeight for accurate overflow measurement
        const width = tempElement.scrollWidth;
        const height = tempElement.scrollHeight;
        const fitsWidth = width <= availableWidth;
        const fitsHeight = height <= availableHeight;

        return fitsWidth && fitsHeight;
      };

      // Binary search to find the largest font size that fits
      while (minSize <= maxSize) {
        const midSize = Math.floor((minSize + maxSize) / 2);
        
        if (testFontSize(midSize)) {
          optimalSize = midSize;
          minSize = midSize + 1; // Try a larger size
        } else {
          maxSize = midSize - 1; // Try a smaller size
        }
      }

      // Clean up temporary element
      document.body.removeChild(tempElement);

      setFontSize(optimalSize);
      setFontSizeCalculated(true); // Mark as calculated
    };

    // Calculate font size when slide content changes
    const timer = setTimeout(calculateFontSize, 10);
    return () => {
      clearTimeout(timer);
    };
  }, [slide.html, fontSizeCalculated]);

  const isThisSlideActive = activeSlideId === slide.id;
  
  return (
    <div 
      ref={containerRef}
      className={`${styles.slideContainer} ${className || ''} ${isThisSlideActive ? styles.active : ''}`}
    >
      <div 
        ref={stageRef}
        className={styles.slideStage}
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
    >
      <div className={styles.slideContent}>
        {/* Check if this is a video slide */}
        {slide.html.includes('<iframe') ? (
          <div 
            ref={contentRef}
            data-slide-content="true"
            data-slide-id={uniqueId}
            data-edit-mode={editMode}
            style={{ 
              width: '100%',
              height: '100%',
              position: 'relative'
            }}
            dangerouslySetInnerHTML={{ __html: slide.html }}
          />
        ) : (
          <div 
            ref={contentRef}
            className={styles.slideText}
            data-slide-content="true"
            data-slide-id={uniqueId}
            data-edit-mode={editMode}
            style={{ 
              fontSize: `${fontSize}px`,
              visibility: fontSize > 0 ? 'visible' : 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: slide.html.replace(/font-size\s*:\s*[^;"']+;?/gi, '') }}
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default SlideRenderer; 