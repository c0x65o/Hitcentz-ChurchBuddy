import React, { useRef, useEffect, useState } from 'react';
import { ISlide } from '../../types/ISlide';
import styles from './SlideRenderer.module.css';

interface SlideRendererProps {
  slide: ISlide;
  className?: string;
  disableScaling?: boolean;
  isActive?: boolean; // New prop to control video playback
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className, disableScaling = false, isActive = false }) => {
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