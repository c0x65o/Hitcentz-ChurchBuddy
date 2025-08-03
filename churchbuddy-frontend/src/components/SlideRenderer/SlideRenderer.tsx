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
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className, editMode = false, onTextEdit, uniqueId, disableScaling = false, isActive = false }) => {
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
    
    console.log('SlideRenderer - slide HTML:', slide.html);
    console.log('SlideRenderer - background URL:', bgUrl);
    
    if (bgUrl) {
      console.log('SlideRenderer - applying background:', bgUrl);
      containerRef.current.style.backgroundImage = `url(${bgUrl})`;
      containerRef.current.style.backgroundSize = 'cover';
      containerRef.current.style.backgroundPosition = 'center';
      containerRef.current.style.backgroundRepeat = 'no-repeat';
    } else {
      console.log('SlideRenderer - no background found, clearing');
      containerRef.current.style.backgroundImage = '';
      containerRef.current.style.backgroundSize = '';
      containerRef.current.style.backgroundPosition = '';
      containerRef.current.style.backgroundRepeat = '';
    }
  }, [slide.html]);

  // Video control based on isActive prop
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Video control useEffect - isActive:', isActive, 'slide.html length:', slide.html.length);

    // Handle YouTube iframes (background videos)
    const youtubeIframes = containerRef.current.querySelectorAll('iframe[src*="youtube.com"]');
    console.log('Found YouTube iframes:', youtubeIframes.length);
    
    youtubeIframes.forEach((iframe, index) => {
      const iframeElement = iframe as HTMLIFrameElement;
      console.log(`Iframe ${index} src:`, iframeElement.src);
      
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
          console.log('Video play failed:', error);
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

      allElements.forEach((htmlElement) => {
        if (!(htmlElement instanceof HTMLElement)) return;

        // Always process elements to ensure event listeners are attached
        // Remove any existing processed flag to allow re-processing
        delete htmlElement.dataset.processed;

        // Create handles for this element
        const allHandles: HTMLElement[] = [];

        // Create corner handles (squares)
        const cornerHandles = [
          { name: 'corner-tl', type: 'resize', width: '8px', height: '8px', cursor: 'nw-resize' },
          { name: 'corner-tr', type: 'resize', width: '8px', height: '8px', cursor: 'ne-resize' },
          { name: 'corner-bl', type: 'resize', width: '8px', height: '8px', cursor: 'sw-resize' },
          { name: 'corner-br', type: 'resize', width: '8px', height: '8px', cursor: 'se-resize' }
        ];

        cornerHandles.forEach((pos) => {
          const handle = document.createElement('div');
          handle.style.position = 'absolute';
          // Initial positioning will be set by adjustHandlePositions()
          handle.style.top = '0px';
          handle.style.left = '0px';
          handle.style.width = pos.width;
          handle.style.height = pos.height;
          handle.style.background = '#ef4444';
          handle.style.border = '1px solid white';
          handle.style.borderRadius = '2px';
          handle.style.cursor = pos.cursor;
          handle.style.opacity = '0';
          handle.style.transition = 'opacity 0.2s ease';
          handle.style.display = 'none';
          handle.style.zIndex = '1000';
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
            htmlElement.appendChild(handle);
          }
          console.log(`Created corner handle: ${pos.name}`);
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
          handle.style.position = 'absolute';
          // Initial positioning will be set by adjustHandlePositions()
          handle.style.top = '0px';
          handle.style.left = '0px';
          handle.style.width = pos.width;
          handle.style.height = pos.height;
          handle.style.background = '#3b82f6';
          handle.style.border = '1px solid white';
          handle.style.borderRadius = '3px';
          handle.style.cursor = pos.cursor;
          handle.style.opacity = '0';
          handle.style.transition = 'opacity 0.2s ease';
          handle.style.display = 'none';
          handle.style.zIndex = '999';
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
            htmlElement.appendChild(handle);
          }
          console.log(`Created edge handle: ${pos.name}`);
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
        rotateButton.style.zIndex = '1001';
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
        
        console.log(`Created ${allHandles.length} handles for element:`, htmlElement.tagName);
        
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
          
          console.log('Positioned ALL handles (Canva-style):', { elementLeft, elementTop, elementWidth, elementHeight });
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
          console.log('Double-click detected on element:', htmlElement.tagName);
          
          // Make text elements editable on double-click
          if (htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$/)) {
            htmlElement.contentEditable = 'true';
            htmlElement.focus();
            
            // Select all text for easy editing
            const range = document.createRange();
            range.selectNodeContents(htmlElement);
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              selection.addRange(range);
            }
            
            console.log('Made element editable on double-click:', htmlElement.tagName);
          }
        };
        
        // Simple click handler for drag selection
        const handleTextClick = (e: Event) => {
          if (!editMode) return;
          
          e.stopPropagation();
          e.preventDefault();
          console.log('Click detected on element:', htmlElement.tagName);
          
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
          
          e.stopPropagation();
          e.preventDefault();
          
          console.log('Drag start on element:', htmlElement.tagName);
          
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
        };
        
        const handleDragMove = (e: MouseEvent) => {
          if (!isDragging || !editMode) return;
          
          e.preventDefault();
          
          const deltaX = e.clientX - dragStartX;
          const deltaY = e.clientY - dragStartY;
          
          if (isResizing) {
            // Handle resize
            const newWidth = originalWidth + deltaX;
            const newHeight = originalHeight + deltaY;
            
            // Minimum size constraints
            const minSize = 50;
            htmlElement.style.width = `${Math.max(newWidth, minSize)}px`;
            htmlElement.style.height = `${Math.max(newHeight, minSize)}px`;
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
          
          console.log('Drag end on element:', htmlElement.tagName);
          
          isDragging = false;
          isResizing = false;
          htmlElement.style.cursor = 'grab';
          htmlElement.classList.remove('dragging');
          document.body.style.userSelect = '';
          
          // Save the new position/size
          if (onTextEdit) {
            const newText = htmlElement.textContent || '';
            onTextEdit(htmlElement, newText);
          }
        };
        
        // Create resize handles
        const createResizeHandles = () => {
          if (!editMode) return;
          
          // Remove existing handles
          const existingHandles = htmlElement.querySelectorAll('.resize-handle');
          existingHandles.forEach(handle => handle.remove());
          
          // Create new handles
          const handles = ['nw', 'ne', 'sw', 'se'];
          handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-handle-${position}`;
            handle.dataset.position = position;
            handle.style.cssText = `
              position: absolute;
              width: 6px;
              height: 6px;
              background: #007bff;
              border: 1px solid rgba(255, 255, 255, 0.8);
              border-radius: 50%;
              cursor: ${position === 'nw' || position === 'se' ? 'nw-resize' : 'ne-resize'};
              z-index: 1001;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
              min-width: 6px;
              min-height: 6px;
              max-width: 6px;
              max-height: 6px;
            `;
            
            // Position the handle
            switch(position) {
              case 'nw':
                handle.style.top = '-3px';
                handle.style.left = '-3px';
                break;
              case 'ne':
                handle.style.top = '-3px';
                handle.style.right = '-3px';
                break;
              case 'sw':
                handle.style.bottom = '-3px';
                handle.style.left = '-3px';
                break;
              case 'se':
                handle.style.bottom = '-3px';
                handle.style.right = '-3px';
                break;
            }
            
            // Add resize event listeners
            handle.addEventListener('mousedown', (e) => {
              e.stopPropagation();
              isResizing = true;
              resizeHandle = position;
              handleDragStart(e);
            });
            
            htmlElement.appendChild(handle);
          });
        };
        
        // Show/hide resize handles based on selection
        const updateResizeHandles = () => {
          const handles = htmlElement.querySelectorAll('.resize-handle');
          if (editMode) {
            handles.forEach(handle => {
              (handle as HTMLElement).style.display = 'block';
            });
          } else {
            handles.forEach(handle => {
              (handle as HTMLElement).style.display = 'none';
            });
          }
        };
        
        // Also handle mousedown to ensure click is captured
        const handleMouseDown = (e: Event) => {
          e.stopPropagation();
          console.log('MouseDown detected on element:', htmlElement.tagName);
          
          // Start drag if in edit mode
          if (editMode && htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$/)) {
            handleDragStart(e as MouseEvent);
          }
        };
        
                // Simple blur handler to save changes
        const handleBlur = () => {
          console.log('Text blur - saving changes for element:', htmlElement.tagName);
          try {
            htmlElement.contentEditable = 'false';
            console.log('Set contentEditable to false for:', htmlElement.tagName);
            
            if (onTextEdit) {
              const newText = htmlElement.textContent || '';
              console.log('Calling onTextEdit with text:', newText);
              onTextEdit(htmlElement, newText);
            }
          } catch (error) {
            console.error('Error in handleBlur:', error);
          }
        };
        
        // Simple handle visibility - always hide handles for now
        const updateHandleVisibility = () => {
          // Hide all handles - we're starting fresh
          allHandles.forEach(handle => {
            handle.style.display = 'none';
            handle.style.opacity = '0';
          });
        };
        
        // Initial visibility update
        updateHandleVisibility();
        
        // Simple hover effects
        const handleMouseEnter = () => {
          // No hover effects for now - keeping it simple
        };
        
        const handleMouseLeave = () => {
          // No hover effects for now - keeping it simple
        };
        
        // DRAG EVENT LISTENERS COMMENTED OUT - STARTING FRESH
        /*
        // Attach interaction handlers to all handles
        allHandles.forEach(handle => {
          handle.addEventListener('mousedown', handleInteractionStart);
          console.log('Attached interaction listener to handle:', handle.dataset.handleName, handle.dataset.handleType);
        });
        */
        
        // Attach editing to the text element
        htmlElement.addEventListener('click', handleTextClick);
        htmlElement.addEventListener('dblclick', handleDoubleClick);
        htmlElement.addEventListener('mousedown', handleMouseDown);
        htmlElement.addEventListener('blur', handleBlur);
        htmlElement.addEventListener('mouseenter', handleMouseEnter);
        htmlElement.addEventListener('mouseleave', handleMouseLeave);
        
        // Add global mouse event listeners for drag
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
        
        // Create resize handles for text elements
        if (editMode && htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$/)) {
          createResizeHandles();
          updateResizeHandles();
        }
        
        // Make sure text elements are clickable and draggable
        if (htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$/)) {
          htmlElement.style.cursor = editMode ? 'grab' : 'text';
          htmlElement.style.pointerEvents = 'auto';
          htmlElement.style.userSelect = editMode ? 'none' : 'text';
          
          // Add title attribute to indicate double-click for editing
          if (editMode) {
            htmlElement.title = 'Double-click to edit text';
          }
          
          // Add text box styling for edit mode
          if (editMode) {
            htmlElement.style.position = 'absolute';
            htmlElement.style.minWidth = '100px';
            htmlElement.style.minHeight = '30px';
            htmlElement.style.padding = '8px';
            htmlElement.style.border = '1px dashed #007bff';
            htmlElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
            htmlElement.style.borderRadius = '4px';
          }
        }
        
        console.log('Attached event listeners to element:', htmlElement.tagName);
        
        // No observer needed - keeping it simple
        
        // Simple image/iframe click handler
        if (htmlElement.tagName === 'IMG' || htmlElement.tagName === 'IFRAME') {
          htmlElement.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Clicked on image/iframe:', htmlElement.tagName);
          });
        }
        
        // Simple cleanup function
        cleanupFunctions.push(() => {
          console.log('Cleaning up element:', htmlElement.tagName);
          htmlElement.removeEventListener('click', handleTextClick);
          htmlElement.removeEventListener('mousedown', handleMouseDown);
          htmlElement.removeEventListener('blur', handleBlur);
          htmlElement.removeEventListener('mouseenter', handleMouseEnter);
          htmlElement.removeEventListener('mouseleave', handleMouseLeave);
          htmlElement.contentEditable = 'false';
          
          // Remove global event listeners
          document.removeEventListener('mousemove', handleGlobalMouseMove);
          document.removeEventListener('mouseup', handleGlobalMouseUp);
          
          console.log('Cleanup complete for element');
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
      
      // Always use fixed 1920x1080 template size
      const availableWidth = 1920; // Use full width, let CSS padding handle spacing
      const availableHeight = 1080 - 80; // Keep height constraint for vertical fitting

      // Create a temporary element for accurate measurement
      const tempElement = document.createElement('div');
      tempElement.innerHTML = slide.html;
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

  return (
    <div 
      ref={containerRef}
      className={`${styles.slideContainer} ${className || ''}`}
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
            dangerouslySetInnerHTML={{ __html: slide.html }}
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default SlideRenderer; 