import React, { useRef, useEffect, useState } from 'react';
import { ISlide } from '../../types/ISlide';
import styles from './SlideRenderer.module.css';

interface SlideRendererProps {
  slide: ISlide;
  className?: string;
  editMode?: boolean;
  onTextEdit?: (element: HTMLElement, newText: string) => void;
  uniqueId?: string;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className, editMode = false, onTextEdit, uniqueId }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(0); // Start with 0 to prevent flash
  const [scale, setScale] = useState(1);

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

  // Separate useEffect for edit mode
  useEffect(() => {
    if (!editMode || !contentRef.current || fontSize === 0) return; // Wait for font size to be calculated

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const textElements = contentRef.current!.querySelectorAll('h1, h2, h3, p, div, img, iframe');
      const cleanupFunctions: (() => void)[] = [];
    
    textElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Make text elements clickable and editable
      htmlElement.style.cursor = 'text';
      htmlElement.style.outline = '2px solid transparent';
      htmlElement.style.transition = 'outline 0.2s ease';
      
      // Only set position if not already positioned
      if (!htmlElement.style.position) {
        htmlElement.style.position = 'relative';
      }
      
      // Initialize interaction variables
      let isDragging = false;
      let isResizing = false;
      let resizeType = ''; // 'corner', 'width', 'height'
      let dragStartX = 0;
      let dragStartY = 0;
      let resizeStartX = 0;
      let resizeStartY = 0;
      let currentTransformX = 0;
      let currentTransformY = 0;
      let hasStartedMoving = false; // Track first move for immediate handle cleanup
      let originalWidth = 0;
      let originalHeight = 0;
      let originalFontSize = 0;
      let currentWidth = 0;
      let currentHeight = 0;
      
      // If element has saved transform, preserve it
      const savedTransform = htmlElement.style.transform;
      if (savedTransform && savedTransform.includes('translate')) {
        console.log('Preserving saved position:', savedTransform);
        // Extract the transform values
        const match = savedTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (match) {
          currentTransformX = parseFloat(match[1]);
          currentTransformY = parseFloat(match[2]);
          console.log('Restored position:', currentTransformX, currentTransformY);
        }
      }
      
      // Store original text content for accurate HTML replacement
      const originalTextContent = htmlElement.textContent || '';
      
      // Ensure element has an ID for handle tracking
      if (!htmlElement.id) {
        htmlElement.id = `text-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Create Canva-style handles
      const allHandles: HTMLElement[] = [];
      
      // Corner handles (resize entire element including font)
      const cornerHandles = [
        { top: '-8px', left: '-8px', name: 'corner-tl', cursor: 'nw-resize', type: 'corner' },
        { top: '-8px', right: '-8px', name: 'corner-tr', cursor: 'ne-resize', type: 'corner' },
        { bottom: '-8px', left: '-8px', name: 'corner-bl', cursor: 'sw-resize', type: 'corner' },
        { bottom: '-8px', right: '-8px', name: 'corner-br', cursor: 'se-resize', type: 'corner' }
      ];
      
      // Edge handles (resize width/height only)
      const edgeHandles = [
        { top: '-4px', left: '50%', transform: 'translateX(-50%)', name: 'edge-top', cursor: 'n-resize', type: 'height', width: '40px', height: '8px' },
        { bottom: '-4px', left: '50%', transform: 'translateX(-50%)', name: 'edge-bottom', cursor: 's-resize', type: 'height', width: '40px', height: '8px' },
        { left: '-4px', top: '50%', transform: 'translateY(-50%)', name: 'edge-left', cursor: 'w-resize', type: 'width', width: '8px', height: '40px' },
        { right: '-4px', top: '50%', transform: 'translateY(-50%)', name: 'edge-right', cursor: 'e-resize', type: 'width', width: '8px', height: '40px' }
      ];
      
      // Create corner handles (small squares)
      cornerHandles.forEach((pos) => {
        const handle = document.createElement('div');
        handle.style.position = 'absolute';
        // Initial positioning will be set by adjustHandlePositions()
        handle.style.top = '0px';
        handle.style.left = '0px';
        handle.style.width = '12px';
        handle.style.height = '12px';
        handle.style.background = '#3b82f6';
        handle.style.border = '2px solid white';
        handle.style.borderRadius = '3px';
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
      
      // Create drag handle (bottom center with icon) - clean rectangular design
      const dragHandle = document.createElement('div');
      dragHandle.style.position = 'absolute';
      dragHandle.style.bottom = '-35px';
      dragHandle.style.left = '0px';
      dragHandle.style.transform = 'translateX(-70px)';
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
      
      // Create rotate button (next to drag handle) - clean rectangular design
      const rotateButton = document.createElement('div');
      rotateButton.style.position = 'absolute';
      rotateButton.style.bottom = '-35px';
      rotateButton.style.right = '0px';
      rotateButton.style.transform = 'translateX(70px)';
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
        const rotateMatch = currentTransform.match(/rotate\(([^)]+)deg\)/);
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
        
        // Position rotate button directly below element, right side
        let rotateX = elementLeft + elementWidth - 70; // 70px from right edge of element
        let rotateY = dragY;
        
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
      setTimeout(() => adjustHandlePositions(), 100);
      
      // Drag functionality using CSS transform

      const handleInteractionStart = (e: MouseEvent) => {
        console.log('=== INTERACTION START ===');
        const target = e.target as HTMLElement;
        const handleType = target.dataset.handleType;
        const handleName = target.dataset.handleName;
        
        console.log('Handle clicked:', handleName, 'Type:', handleType);
        console.log('Element:', htmlElement.tagName, htmlElement.textContent);
        
        // Allow interactions even during text editing
        console.log('Interaction allowed during text editing');
        
        e.preventDefault();
        e.stopPropagation();
        
        // Store original state
        const rect = htmlElement.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(htmlElement);
        originalWidth = rect.width / scale;
        originalHeight = rect.height / scale;
        originalFontSize = parseFloat(computedStyle.fontSize) || 16;
        
        console.log('Original state:', { width: originalWidth, height: originalHeight, fontSize: originalFontSize });
        
        // Reset movement tracking for immediate handle cleanup
        hasStartedMoving = false;
        
        if (handleType === 'drag') {
          // Drag operation - move element
          isDragging = true;
          dragStartX = e.clientX;
          dragStartY = e.clientY;
          console.log('Starting drag operation');
        } else if (handleType === 'rotate') {
          // Rotate operation - 90 degree rotation
          console.log('Rotating element 90 degrees');
          handleRotate();
          return; // No need for move/end listeners
        } else if (handleType === 'corner' || handleType === 'width' || handleType === 'height') {
          // Resize operations
          isResizing = true;
          resizeStartX = e.clientX;
          resizeStartY = e.clientY;
          currentWidth = originalWidth;
          currentHeight = originalHeight;
          
          // Store which specific handle for proper resize direction
          if (handleType === 'corner') {
            // Use the specific corner handle name for proper scaling direction
            resizeType = handleName || 'corner';
          } else if (handleType === 'height') {
            if (handleName === 'edge-top') {
              resizeType = 'height-top';
            } else if (handleName === 'edge-bottom') {
              resizeType = 'height-bottom';
            }
          } else if (handleType === 'width') {
            if (handleName === 'edge-left') {
              resizeType = 'width-left';
            } else if (handleName === 'edge-right') {
              resizeType = 'width-right';
            }
          }
          
          console.log('Starting resize operation:', resizeType, 'Handle:', handleName);
        }
        
        htmlElement.style.zIndex = '100';
        htmlElement.style.userSelect = 'none';
        
        // Show all handles during operation - force visible even off-screen
        allHandles.forEach(handle => {
          handle.style.opacity = '1';
          handle.style.pointerEvents = 'auto';
        });
        
        document.addEventListener('mousemove', handleInteractionMove);
        document.addEventListener('mouseup', handleInteractionEnd);
        
        console.log('Interaction listeners attached');
      };
      
      const handleRotate = () => {
        // Get current rotation or default to 0
        const currentTransform = htmlElement.style.transform || '';
        let currentRotation = 0;
        
        const rotateMatch = currentTransform.match(/rotate\(([^)]+)deg\)/);
        if (rotateMatch) {
          currentRotation = parseFloat(rotateMatch[1]);
        }
        
        // Add 90 degrees
        const newRotation = (currentRotation + 90) % 360;
        
        // Preserve existing translate values
        const translateMatch = currentTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        let transformString = `rotate(${newRotation}deg)`;
        
        if (translateMatch) {
          transformString = `translate(${translateMatch[1]}px, ${translateMatch[2]}px) rotate(${newRotation}deg)`;
        }
        
        htmlElement.style.transform = transformString;
        console.log('Applied rotation:', transformString);
        
        // Immediately update handle positions after rotation
        setTimeout(() => {
          adjustHandlePositions();
        }, 10);
      };

      const handleInteractionMove = (e: MouseEvent) => {
        if (!isDragging && !isResizing) {
          return;
        }
        
        e.preventDefault();
        
        // On first move, immediately remove handles for ultra-responsive cleanup
        if (!hasStartedMoving) {
          const allHandlesToRemove = document.querySelectorAll('[data-handle-name], [data-handle-type]');
          console.log('First move detected - immediately removing', allHandlesToRemove.length, 'handles');
          allHandlesToRemove.forEach(handle => {
            if (handle.parentNode) {
              handle.parentNode.removeChild(handle);
            }
          });
          hasStartedMoving = true;
        }
        
        if (isDragging) {
          // Handle drag operation - move element position
          const deltaX = (e.clientX - dragStartX) / scale;
          const deltaY = (e.clientY - dragStartY) / scale;
          
          let newX = currentTransformX + deltaX;
          let newY = currentTransformY + deltaY;
          
          // No bounds checking - allow dragging anywhere (even off-slide)
          console.log('Drag move - New position:', newX, newY);
          
          // Preserve any existing rotation
          const currentTransform = htmlElement.style.transform || '';
          const rotateMatch = currentTransform.match(/rotate\([^)]+\)/);
          const rotateString = rotateMatch ? ` ${rotateMatch[0]}` : '';
          
          htmlElement.style.transform = `translate(${newX}px, ${newY}px)${rotateString}`;
          
          // Adjust handle positions during drag
          adjustHandlePositions();
          
        } else if (isResizing) {
          // Handle resize operations
          const deltaX = (e.clientX - resizeStartX) / scale;
          const deltaY = (e.clientY - resizeStartY) / scale;
          
          if (resizeType === 'corner' || resizeType === 'corner-tl' || resizeType === 'corner-tr' || resizeType === 'corner-bl' || resizeType === 'corner-br') {
            // Corner resize - scale entire element including font
            // Determine which corner is being dragged and adjust scaling accordingly
            let scaleFactor = 1;
            
            if (resizeType === 'corner-tl') {
              // Top-left: scale based on distance from bottom-right corner
              scaleFactor = Math.max(0.3, 1 - (deltaX + deltaY) / (originalWidth + originalHeight));
            } else if (resizeType === 'corner-tr') {
              // Top-right: scale based on distance from bottom-left corner
              scaleFactor = Math.max(0.3, 1 - (-deltaX + deltaY) / (originalWidth + originalHeight));
            } else if (resizeType === 'corner-bl') {
              // Bottom-left: scale based on distance from top-right corner
              scaleFactor = Math.max(0.3, 1 - (deltaX - deltaY) / (originalWidth + originalHeight));
            } else if (resizeType === 'corner-br') {
              // Bottom-right: scale based on distance from top-left corner
              scaleFactor = Math.max(0.3, 1 + (deltaX + deltaY) / (originalWidth + originalHeight));
            } else {
              // Fallback for generic corner resize
              scaleFactor = Math.max(0.3, 1 + (deltaX + deltaY) / (originalWidth + originalHeight));
            }
            
            const newFontSize = Math.max(8, originalFontSize * scaleFactor);
            const newWidth = Math.max(30, originalWidth * scaleFactor);
            const newHeight = Math.max(20, originalHeight * scaleFactor);
            
            htmlElement.style.fontSize = `${newFontSize}px`;
            htmlElement.style.width = `${newWidth}px`;
            htmlElement.style.height = `${newHeight}px`;
            
            console.log('Corner resize - Type:', resizeType, 'Scale:', scaleFactor, 'Font:', newFontSize, 'Size:', newWidth, newHeight);
            
          } else if (resizeType === 'width-right') {
            // Right edge resize - increase width to the right
            const newWidth = Math.max(20, originalWidth + deltaX);
            htmlElement.style.width = `${newWidth}px`;
            htmlElement.style.minWidth = '20px';
            htmlElement.style.maxWidth = 'none';
            console.log('Width resize (right) - New width:', newWidth);
            
          } else if (resizeType === 'width-left') {
            // Left edge resize - increase width to the left
            const newWidth = Math.max(20, originalWidth - deltaX);
            htmlElement.style.width = `${newWidth}px`;
            htmlElement.style.minWidth = '20px';
            htmlElement.style.maxWidth = 'none';
            console.log('Width resize (left) - New width:', newWidth);
            
          } else if (resizeType === 'height-bottom') {
            // Bottom edge resize - increase height downward
            const newHeight = Math.max(20, originalHeight + deltaY);
            htmlElement.style.height = `${newHeight}px`;
            htmlElement.style.minHeight = '20px';
            htmlElement.style.maxHeight = 'none';
            console.log('Height resize (bottom) - New height:', newHeight);
            
          } else if (resizeType === 'height-top') {
            // Top edge resize - increase height upward and move element up
            const newHeight = Math.max(20, originalHeight - deltaY);
            const heightDifference = originalHeight - newHeight;
            
            // Update height
            htmlElement.style.height = `${newHeight}px`;
            htmlElement.style.minHeight = '20px';
            htmlElement.style.maxHeight = 'none';
            
            // Move element up by the height difference
            const currentTransform = htmlElement.style.transform;
            const match = currentTransform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
            if (match) {
              const currentX = parseFloat(match[1]);
              const currentY = parseFloat(match[2]);
              const newY = currentY - heightDifference;
              htmlElement.style.transform = `translate(${currentX}px, ${newY}px)`;
            }
            
            console.log('Height resize (top) - New height:', newHeight, 'Moved up by:', heightDifference);
            
          } else if (resizeType === 'width' || resizeType === 'height') {
            // Fallback for generic width/height (shouldn't happen now)
            if (resizeType === 'width') {
              const newWidth = Math.max(20, originalWidth + deltaX);
              htmlElement.style.width = `${newWidth}px`;
              console.log('Generic width resize:', newWidth);
            } else {
              const newHeight = Math.max(20, originalHeight + deltaY);
              htmlElement.style.height = `${newHeight}px`;
              console.log('Generic height resize:', newHeight);
            }
          }
          
          // Adjust handle positions during resize
          adjustHandlePositions();
        }
      };

      const handleInteractionEnd = () => {
        console.log('=== INTERACTION END ===');
        console.log('isDragging:', isDragging, 'isResizing:', isResizing);
        
        if (!isDragging && !isResizing) {
          return;
        }
        
        try {
          if (isDragging) {
            // Handle drag end - update stored position
            isDragging = false;
            
            const transform = htmlElement.style.transform;
            console.log('Final transform:', transform);
            
            const match = transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
            if (match) {
              currentTransformX = parseFloat(match[1]);
              currentTransformY = parseFloat(match[2]);
              console.log('Updated stored position:', currentTransformX, currentTransformY);
            }
            
            console.log('Drag ended successfully');
          } else if (isResizing) {
            // Handle resize end
            isResizing = false;
            resizeType = '';
            
            console.log('Resize ended successfully');
          }
          
          htmlElement.style.zIndex = 'auto';
          htmlElement.style.userSelect = '';
          
          // IMMEDIATELY remove all handles when interaction ends - no delay!
          const allHandlesToRemove = document.querySelectorAll('[data-handle-name], [data-handle-type]');
          console.log('Immediately removing', allHandlesToRemove.length, 'handles after interaction');
          allHandlesToRemove.forEach(handle => {
            if (handle.parentNode) {
              handle.parentNode.removeChild(handle);
            }
          });
          
          console.log('Interaction ended successfully');
          
          // Save changes to HTML after handles are already gone
          setTimeout(() => {
            try {
              console.log('Auto-saving changes after interaction');
              
              if (onTextEdit) {
                // Clean the text content of any handle symbols
                const currentText = (htmlElement.textContent || '').replace(/[⋮⠿↻🔄✋]/g, '').trim();
                console.log('Saving element with text:', currentText);
                onTextEdit(htmlElement, currentText);
              }
              
            } catch (saveError) {
              console.error('Error during auto-save:', saveError);
            }
          }, 100); // Much faster since handles are already gone
          
        } catch (error) {
          console.error('Error in handleInteractionEnd:', error);
          if (error instanceof Error) {
            console.error('Stack trace:', error.stack);
          }
        } finally {
          console.log('Removing interaction listeners');
          document.removeEventListener('mousemove', handleInteractionMove);
          document.removeEventListener('mouseup', handleInteractionEnd);
          console.log('=== INTERACTION END COMPLETE ===');
        }
      };

      // Add click handler for editing (single click now)
      const handleTextClick = (e: Event) => {
        e.stopPropagation();
        
        // Remove selection from all other elements
        const allElements = contentRef.current!.querySelectorAll('h1, h2, h3, p, div, img, iframe');
        allElements.forEach((el) => {
          if (el !== htmlElement) {
            (el as HTMLElement).classList.remove('selected');
            (el as HTMLElement).blur();
            (el as HTMLElement).contentEditable = 'false';
          }
        });
        
        // Add selection to this element
        htmlElement.classList.add('selected');
        
        const wasAlreadyEditable = htmlElement.contentEditable === 'true';
        
        // Add editing outline
        htmlElement.style.outline = '2px solid rgba(255, 255, 255, 0.5)';
        
        // Make contentEditable for text elements
        if (htmlElement.tagName.match(/^H[1-6]$|^P$|^DIV$/)) {
          htmlElement.contentEditable = 'true';
          
          if (!wasAlreadyEditable) {
            // Only select all text on first click to enter edit mode
            htmlElement.focus();
            const range = document.createRange();
            range.selectNodeContents(htmlElement);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            console.log('Entering edit mode - selected all text');
          } else {
            // If already editable, just focus but don't change selection
            console.log('Already in edit mode - preserving cursor position');
          }
        }
      };
      
      // Add blur handler to save changes
      const handleBlur = () => {
        console.log('Text blur - saving changes');
        try {
          htmlElement.contentEditable = 'false';
          htmlElement.style.outline = '2px solid transparent';
          
          if (onTextEdit) {
            // Get text content but exclude all handle symbols
            let newText = htmlElement.textContent || '';
            // Remove all possible handle symbols
            newText = newText.replace(/[⋮⠿↻]/g, '').trim();
            
            console.log('Calling onTextEdit with clean text:', newText);
            onTextEdit(htmlElement, newText);
          }
        } catch (error) {
          console.error('Error in handleBlur:', error);
        }
      };
      
      // Function to show/hide handles based on selection
      const updateHandleVisibility = () => {
        const isSelected = htmlElement.classList.contains('selected');
        console.log(`Element ${htmlElement.tagName} selected: ${isSelected}`);
        
        if (isSelected) {
          // Show handles with full opacity when selected
          htmlElement.style.outline = '2px solid rgba(255, 255, 255, 0.8)';
          allHandles.forEach(handle => {
            handle.style.display = 'block';
            handle.style.opacity = '1';
          });
          adjustHandlePositions(); // Adjust positions when showing handles
          console.log('Showing', allHandles.length, 'handles for selected element');
        } else {
          // Hide handles when not selected
          htmlElement.style.outline = '2px solid rgba(255, 255, 255, 0.1)';
          allHandles.forEach(handle => {
            handle.style.display = 'none';
            handle.style.opacity = '0';
          });
          console.log('Hiding handles for unselected element');
        }
      };
      
      // Initial visibility update
      updateHandleVisibility();
      
      // Add hover effect for subtle outline
      const handleMouseEnter = () => {
        if (!htmlElement.classList.contains('selected')) {
          htmlElement.style.outline = '2px solid rgba(255, 255, 255, 0.3)';
        }
      };
      
      const handleMouseLeave = () => {
        if (!htmlElement.classList.contains('selected')) {
          htmlElement.style.outline = '2px solid rgba(255, 255, 255, 0.1)';
        }
      };
      
      // Attach interaction handlers to all handles
      allHandles.forEach(handle => {
        handle.addEventListener('mousedown', handleInteractionStart);
        console.log('Attached interaction listener to handle:', handle.dataset.handleName, handle.dataset.handleType);
      });
      
      // Attach editing to the text element
      htmlElement.addEventListener('click', handleTextClick);
      htmlElement.addEventListener('blur', handleBlur);
      htmlElement.addEventListener('mouseenter', handleMouseEnter);
      htmlElement.addEventListener('mouseleave', handleMouseLeave);
      
      // Watch for selection changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            updateHandleVisibility();
          }
        });
      });
      
      observer.observe(htmlElement, {
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Also handle images and iframes for selection
      if (htmlElement.tagName === 'IMG' || htmlElement.tagName === 'IFRAME') {
        htmlElement.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Remove selection from all other elements
          const allElements = contentRef.current!.querySelectorAll('h1, h2, h3, p, div, img, iframe');
          allElements.forEach((el) => {
            if (el !== htmlElement) {
              (el as HTMLElement).classList.remove('selected');
            }
          });
          
          // Add selection to this element
          htmlElement.classList.add('selected');
        });
      }
      
      // Store cleanup function
      cleanupFunctions.push(() => {
        console.log('Cleaning up element:', htmlElement.tagName);
        allHandles.forEach(handle => {
          handle.removeEventListener('mousedown', handleInteractionStart);
          if (handle.parentNode) {
            handle.parentNode.removeChild(handle);
          }
        });
        htmlElement.removeEventListener('click', handleTextClick);
        htmlElement.removeEventListener('blur', handleBlur);
        htmlElement.removeEventListener('mouseenter', handleMouseEnter);
        htmlElement.removeEventListener('mouseleave', handleMouseLeave);
        observer.disconnect();
        document.removeEventListener('mousemove', handleInteractionMove);
        document.removeEventListener('mouseup', handleInteractionEnd);
        htmlElement.style.cursor = '';
        htmlElement.style.outline = '';
        htmlElement.style.position = '';
        htmlElement.style.transform = '';
        htmlElement.contentEditable = 'false';
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

  // Calculate scale to fit container
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current || !stageRef.current) return;
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
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
  }, []);

  // Calculate font size for fixed 1920x1080 stage
  useEffect(() => {
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
    };

    // Small delay to ensure DOM is ready, but much shorter than before
    const timer = setTimeout(calculateFontSize, 10);
    
    return () => {
      clearTimeout(timer);
    };
  }, [slide.html]);

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
        <div 
          ref={contentRef}
          className={styles.slideText}
            data-slide-content="true"
            data-slide-id={uniqueId}
            style={{ 
              fontSize: `${fontSize}px`,
              visibility: fontSize > 0 ? 'visible' : 'hidden'
            }}
          dangerouslySetInnerHTML={{ __html: slide.html }}
        />
        </div>
      </div>
    </div>
  );
};

export default SlideRenderer; 