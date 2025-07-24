import React, { useState, useEffect } from 'react';
import styles from './CreateItemModal.module.css';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  title: string;
  placeholder: string;
  itemType: 'song' | 'sermon' | 'asset-deck';
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
  itemType
}) => {
  const [itemTitle, setItemTitle] = useState('');

  // Reset title when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setItemTitle('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (itemTitle.trim()) {
      onSubmit(itemTitle.trim());
      setItemTitle('');
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <input
          type="text"
          placeholder={placeholder}
          value={itemTitle}
          onChange={(e) => setItemTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
          autoFocus
        />
        <div className={styles.buttonContainer}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={styles.createButton}
            disabled={!itemTitle.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateItemModal; 