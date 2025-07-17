import React from 'react';
import { ISlide } from '../../types/ISlide';
import styles from './SlideRenderer.module.css';

interface SlideRendererProps {
  slide: ISlide;
  className?: string;
}

const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, className }) => {
  return (
    <div className={`${styles.slideContainer} ${className || ''}`}>
      <div 
        className={styles.slideContent}
        dangerouslySetInnerHTML={{ __html: slide.html }}
      />
    </div>
  );
};

export default SlideRenderer; 