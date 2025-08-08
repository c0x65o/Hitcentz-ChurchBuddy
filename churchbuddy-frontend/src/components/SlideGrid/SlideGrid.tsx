import React from 'react';
import { ISlide } from '../../types/ISlide';
import SlideRenderer from '../SlideRenderer/SlideRenderer';
import styles from './SlideGrid.module.css';

interface SlideGridProps {
  slides: ISlide[];
  onSlideClick?: (slide: ISlide) => void;
  className?: string;
  activeSlideId?: string;
}

const SlideGrid: React.FC<SlideGridProps> = ({ 
  slides, 
  onSlideClick,
  className = '',
  activeSlideId
}) => {
  console.log('SlideGrid received slides:', slides);
  console.log('SlideGrid slides length:', slides?.length);
  
  if (!slides || slides.length === 0) {
    console.log('SlideGrid: No slides provided');
    return <div className={`${styles.slideGrid} ${className}`}>No slides available</div>;
  }

  return (
    <div className={`${styles.slideGrid} ${className}`}>
      {slides.map((slide) => {
        console.log('Rendering slide:', slide);
        const isActive = activeSlideId === slide.id;
        return (
          <div 
            key={slide.id} 
            className={`${styles.slideItem} ${isActive ? styles.activeSlide : ''}`}
            onClick={() => {
              console.warn('🖱️ SLIDE CLICKED:', slide.id, slide.title);
              onSlideClick?.(slide);
            }}
          >
            <div className={styles.slideRenderer}>
              <SlideRenderer
                slide={slide}
                disableScaling={true}
                isActive={false}
                activeSlideId={activeSlideId}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SlideGrid; 