import React, { useRef, useEffect, useState } from 'react';
import { ISlide } from '../../types/ISlide';
import styles from './SlideRenderer.module.css';

interface SlideRendererProps {
  slide: ISlide;
  className?: string;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Template size - slide content is always rendered at this size
  const TEMPLATE_WIDTH = 1920;
  const TEMPLATE_HEIGHT = 1080;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && slideRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate scale to fit the template within the container
        const scaleX = containerWidth / TEMPLATE_WIDTH;
        const scaleY = containerHeight / TEMPLATE_HEIGHT;
        const newScale = Math.min(scaleX, scaleY);
        
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`${styles.slideContainer} ${className || ''}`}
    >
      <div 
        ref={slideRef}
        className={styles.slideContent}
        style={{
          width: TEMPLATE_WIDTH,
          height: TEMPLATE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
        dangerouslySetInnerHTML={{ __html: slide.html }}
      />
    </div>
  );
};

export default SlideRenderer; 