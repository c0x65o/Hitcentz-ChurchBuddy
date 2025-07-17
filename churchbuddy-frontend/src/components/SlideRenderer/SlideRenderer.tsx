import React, { useRef, useEffect, useState } from 'react';
import { ISlide } from '../../types/ISlide';
import styles from './SlideRenderer.module.css';

interface SlideRendererProps {
  slide: ISlide;
  className?: string;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(24);

  useEffect(() => {
    const calculateFontSize = () => {
      if (!contentRef.current || !containerRef.current) return;

      const content = contentRef.current;
      const container = containerRef.current;
      
      // Get container dimensions (minus padding)
      const containerRect = container.getBoundingClientRect();
      const padding = 80; // 40px on each side
      const availableWidth = containerRect.width - padding;
      const availableHeight = containerRect.height - padding;

      // Create a temporary element for accurate measurement
      const tempElement = document.createElement('div');
      tempElement.innerHTML = slide.html;
      tempElement.style.position = 'absolute';
      tempElement.style.visibility = 'hidden';
      tempElement.style.whiteSpace = 'normal'; // Allow line breaks at word boundaries
      tempElement.style.wordBreak = 'keep-all'; // Prevent breaking within words
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
        console.log(`Testing ${size}px: content(${width}x${height}) vs available(${availableWidth}x${availableHeight}) - fits: ${fitsWidth && fitsHeight}`);
        return fitsWidth && fitsHeight;
      };

      console.log(`\n=== CALCULATING FONT SIZE FOR: "${content.textContent}" ===`);
      console.log(`Container: ${containerRect.width}x${containerRect.height}`);
      console.log(`Available space: ${availableWidth}x${availableHeight}`);

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

      console.log(`=== FINAL RESULT: "${content.textContent}" - Optimal font size: ${optimalSize}px ===\n`);
      setFontSize(optimalSize);
    };

    // Use a longer delay to ensure DOM is fully ready
    const timer = setTimeout(calculateFontSize, 300);
    
    // Also recalculate on window resize
    const handleResize = () => {
      const timer = setTimeout(calculateFontSize, 100);
      return () => clearTimeout(timer);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [slide.html]);

  return (
    <div 
      ref={containerRef}
      className={`${styles.slideContainer} ${className || ''}`}
    >
      <div className={styles.slideContent}>
        <div 
          ref={contentRef}
          className={styles.slideText}
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: slide.html }}
        />
      </div>
    </div>
  );
};

export default SlideRenderer; 