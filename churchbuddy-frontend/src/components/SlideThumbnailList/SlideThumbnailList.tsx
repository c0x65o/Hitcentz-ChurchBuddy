import React, { useState } from 'react';
import { ISlide } from '../../types/ISlide';
import SlideThumbnail from '../SlideThumbnail/SlideThumbnail';
import styles from './SlideThumbnailList.module.css';

interface SlideThumbnailListProps {
  slides: ISlide[];
  onReorder?: (slides: ISlide[]) => void;
  onEdit?: (slideId: string) => void;
  onDelete?: (slideId: string) => void;
  onSlideClick?: (slide: ISlide) => void;
  title?: string;
  hideEditButton?: boolean;
}

const SlideThumbnailList: React.FC<SlideThumbnailListProps> = ({
  slides,
  onReorder,
  onEdit,
  onDelete,
  onSlideClick,
  title = "Slides",
  hideEditButton = false
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <button
        className={`${styles.toggle} ${collapsed ? styles.toggleCollapsed : ''}`}
        onClick={() => setCollapsed((prev) => !prev)}
        title={collapsed ? 'Expand slide list' : 'Collapse slide list'}
      >
        <span>{collapsed ? '«' : '»'}</span>
        <span className={styles.tabLabel}>Slides</span>
      </button>

      <div className={`${styles.container} ${collapsed ? styles.collapsed : ''}`}>
        {!collapsed && (
          <>
            <div className={styles.title}>{title}</div>
      <div className={styles.scrollContainer}>
        {slides.map((slide) => (
          <div key={slide.id} className={styles.thumbnailWrapper}>
            <SlideThumbnail
              slide={slide}
              onEdit={hideEditButton ? undefined : onEdit}
              onDelete={onDelete}
              onClick={onSlideClick}
            />
          </div>
        ))}
      </div>
          </>
        )}
    </div>
    </>
  );
};

export default SlideThumbnailList; 