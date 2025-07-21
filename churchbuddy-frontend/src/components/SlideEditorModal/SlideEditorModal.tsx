import React, { useState, useRef, useEffect } from 'react';
import styles from './SlideEditorModal.module.css';
import { ISlide } from '../../types/ISlide';
import SlideRenderer from '../SlideRenderer/SlideRenderer';

interface SlideEditorModalProps {
  slide: ISlide;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSlide: ISlide) => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface VideoElement {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  slide,
  isOpen,
  onClose,
  onSave
}) => {
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [videoElements, setVideoElements] = useState<VideoElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Auto-save functionality
  useEffect(() => {
    if (isOpen) {
      const saveTimer = setTimeout(() => {
        saveSlide();
      }, 1000);
      return () => clearTimeout(saveTimer);
    }
  }, [textElements, imageElements, videoElements, isOpen]);

  const saveSlide = () => {
    // Generate HTML from elements
    const html = generateHTMLFromElements();
    const updatedSlide = {
      ...slide,
      html,
      updatedAt: new Date()
    };
    onSave(updatedSlide);
  };

  const generateHTMLFromElements = (): string => {
    let html = '<div style="position: relative; width: 100%; height: 100%;">';
    
    textElements.forEach(element => {
      html += `<div style="position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; height: ${element.height}px; font-size: ${element.fontSize}px; font-family: ${element.fontFamily}; color: ${element.color}; font-weight: ${element.bold ? 'bold' : 'normal'}; font-style: ${element.italic ? 'italic' : 'normal'};">${element.text}</div>`;
    });

    imageElements.forEach(element => {
      html += `<img src="${element.src}" style="position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; height: ${element.height}px; transform: rotate(${element.rotation}deg);" />`;
    });

    videoElements.forEach(element => {
      const videoId = extractYouTubeId(element.url);
      if (videoId) {
        html += `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" style="position: absolute; left: ${element.x}px; top: ${element.y}px; width: ${element.width}px; height: ${element.height}px;" frameborder="0" allowfullscreen></iframe>`;
      }
    });

    html += '</div>';
    return html;
  };

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const addTextBox = () => {
    const newTextElement: TextElement = {
      id: `text-${Date.now()}`,
      text: 'New Text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      fontSize: 24,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      bold: false,
      italic: false
    };
    setTextElements([...textElements, newTextElement]);
    setSelectedElement(newTextElement.id);
  };

  const addYouTubeVideo = () => {
    const url = prompt('Enter YouTube URL:');
    if (url && extractYouTubeId(url)) {
      const newVideoElement: VideoElement = {
        id: `video-${Date.now()}`,
        url,
        x: 100,
        y: 100,
        width: 320,
        height: 180
      };
      setVideoElements([...videoElements, newVideoElement]);
      setSelectedElement(newVideoElement.id);
    }
  };

  const rotateSelectedImage = () => {
    if (selectedElement && selectedElement.startsWith('image-')) {
      setImageElements(imageElements.map(element => 
        element.id === selectedElement 
          ? { ...element, rotation: element.rotation + 90 }
          : element
      ));
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolGroup}>
            <button className={styles.toolButton} onClick={addTextBox}>
              Add Text
            </button>
            <button className={styles.toolButton} onClick={() => {/* Add image logic */}}>
              Add Image
            </button>
            <button className={styles.toolButton} onClick={addYouTubeVideo}>
              Add YouTube Video
            </button>
          </div>
          
          <div className={styles.toolGroup}>
            <button className={styles.toolButton} onClick={rotateSelectedImage}>
              Rotate Image
            </button>
          </div>

          <div className={styles.toolGroup}>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className={styles.canvasContainer}>
          <div 
            ref={canvasRef}
            className={styles.canvas}
          >
            {/* Render elements */}
            {textElements.map(element => (
              <div
                key={element.id}
                className={`${styles.textElement} ${selectedElement === element.id ? styles.selected : ''}`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  fontSize: element.fontSize,
                  fontFamily: element.fontFamily,
                  color: element.color,
                  fontWeight: element.bold ? 'bold' : 'normal',
                  fontStyle: element.italic ? 'italic' : 'normal'
                }}
                onClick={() => setSelectedElement(element.id)}
              >
                {element.text}
              </div>
            ))}

            {imageElements.map(element => (
              <img
                key={element.id}
                src={element.src}
                className={`${styles.imageElement} ${selectedElement === element.id ? styles.selected : ''}`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation}deg)`
                }}
                onClick={() => setSelectedElement(element.id)}
                alt="Slide element"
              />
            ))}

            {videoElements.map(element => {
              const videoId = extractYouTubeId(element.url);
              return videoId ? (
                <iframe
                  key={element.id}
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className={`${styles.videoElement} ${selectedElement === element.id ? styles.selected : ''}`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height
                  }}
                  onClick={() => setSelectedElement(element.id)}
                  frameBorder="0"
                  allowFullScreen
                />
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditorModal; 