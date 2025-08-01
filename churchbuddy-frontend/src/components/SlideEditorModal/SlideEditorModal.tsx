import React from 'react';
import { ISlide } from '../../types/ISlide';
import { SlideEditor } from '../SlideEditor/SlideEditor';
import styles from './SlideEditorModal.module.css';

interface SlideEditorModalProps {
  isOpen: boolean;
  slide: ISlide | null;
  onClose: () => void;
  onSave: (updatedSlide: ISlide) => void;
}

export const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  isOpen,
  slide,
  onClose,
  onSave
}) => {
  if (!isOpen || !slide) {
    return null;
  }

  const handleSave = (updatedSlide: ISlide) => {
    onSave(updatedSlide);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Edit Slide</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className={styles.modalBody}>
          <SlideEditor
            slide={slide}
            onSave={handleSave}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}; 