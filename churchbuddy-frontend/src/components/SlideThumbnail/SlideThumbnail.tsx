import React from 'react';
import { ISlide } from '../../types/ISlide';
import SlideRenderer from '../SlideRenderer/SlideRenderer';
import styles from './SlideThumbnail.module.css';

interface SlideThumbnailProps {
  slide: ISlide;
  onEdit?: (slideId: string) => void;
  onDelete?: (slideId: string) => void;
  onClick?: (slide: ISlide) => void;
}

const SlideThumbnail: React.FC<SlideThumbnailProps> = ({ 
  slide, 
  onEdit, 
  onDelete,
  onClick
}) => {
  // Check if this slide is active
  const isActive = slide.html.includes('data-active="true"') || slide.html.includes('class="active"');
  
  return (
    <div className={`${styles.thumbnailContainer} ${isActive ? styles.activeSlide : ''}`}>
      <div 
        className={styles.slideWrapper}
        onClick={() => onClick?.(slide)}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <SlideRenderer slide={slide} className={styles.slideRenderer} />
      </div>
      
      {(onEdit || onDelete) && (
        <div className={styles.actionOverlay}>
          {onEdit && (
            <button 
              className={styles.editButton}
              onClick={() => onEdit(slide.id)}
              title="Edit slide"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button 
              className={styles.deleteButton}
              onClick={() => onDelete(slide.id)}
              title="Delete slide"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SlideThumbnail; 