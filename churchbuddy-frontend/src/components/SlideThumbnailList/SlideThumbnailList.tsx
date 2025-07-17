import React from 'react';
import { ISlide } from '../../types/ISlide';
import SlideThumbnail from '../SlideThumbnail/SlideThumbnail';
import styles from './SlideThumbnailList.module.css';

interface SlideThumbnailListProps {
  slides: ISlide[];
  onReorder?: (slides: ISlide[]) => void;
  onEdit?: (slideId: string) => void;
  onDelete?: (slideId: string) => void;
}

const SlideThumbnailList: React.FC<SlideThumbnailListProps> = ({
  slides,
  onReorder,
  onEdit,
  onDelete
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.scrollContainer}>
        {slides.map((slide) => (
          <div key={slide.id} className={styles.thumbnailWrapper}>
            <SlideThumbnail
              slide={slide}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlideThumbnailList; 