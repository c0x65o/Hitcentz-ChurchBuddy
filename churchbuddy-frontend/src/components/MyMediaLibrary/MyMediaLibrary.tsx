import React, { useState, useRef, useCallback } from 'react';
import styles from './MyMediaLibrary.module.css';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  uploadedAt: Date;
  usedIn: string[]; // Array of slide/collection IDs where this media is used
}

interface MyMediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (media: MediaItem) => void;
  onAssignBackground?: (mediaId: string, targetId: string) => void;
}

const MyMediaLibrary: React.FC<MyMediaLibraryProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onAssignBackground
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const newMediaItem: MediaItem = {
          id: `media-${Date.now()}-${index}`,
          name: file.name,
          url: e.target?.result as string,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          size: file.size,
          uploadedAt: new Date(),
          usedIn: []
        };

        setMediaItems(prev => [...prev, newMediaItem]);
        
        if (index === files.length - 1) {
          setIsUploading(false);
          setUploadProgress(100);
        }
      };

      reader.readAsDataURL(file);
    });
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  // Handle media selection
  const handleMediaSelect = (mediaId: string) => {
    setSelectedItems(prev => 
      prev.includes(mediaId) 
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  // Handle media deletion
  const handleDeleteSelected = () => {
    setMediaItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  // Handle media usage
  const handleUseMedia = (media: MediaItem) => {
    if (onSelectMedia) {
      onSelectMedia(media);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>My Media Library</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Upload Area */}
          <div 
            className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInputChange}
              className={styles.fileInput}
            />
            
            {isUploading ? (
              <div className={styles.uploadProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p>Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div className={styles.uploadPrompt}>
                <div className={styles.uploadIcon}>📁</div>
                <p>Drag and drop files here or click to browse</p>
                <button 
                  className={styles.browseButton}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>

          {/* Media Grid */}
          <div className={styles.mediaGrid}>
            {mediaItems.map((item) => (
              <div 
                key={item.id}
                className={`${styles.mediaItem} ${selectedItems.includes(item.id) ? styles.selected : ''}`}
                onClick={() => handleMediaSelect(item.id)}
              >
                <div className={styles.mediaPreview}>
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} />
                  ) : (
                    <video src={item.url} muted />
                  )}
                </div>
                
                <div className={styles.mediaInfo}>
                  <p className={styles.mediaName}>{item.name}</p>
                  <p className={styles.mediaSize}>
                    {(item.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className={styles.mediaUsage}>
                    Used in {item.usedIn.length} places
                  </p>
                </div>

                <div className={styles.mediaActions}>
                  <button 
                    className={styles.useButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseMedia(item);
                    }}
                  >
                    Use
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMediaItems(prev => prev.filter(i => i.id !== item.id));
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className={styles.bulkActions}>
              <button 
                className={styles.deleteSelectedButton}
                onClick={handleDeleteSelected}
              >
                Delete Selected ({selectedItems.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMediaLibrary; 