import { ISlide, ISlideElement } from '../types/ISlide';

/**
 * Convert JSON slide data to HTML for presentation
 */
export function jsonToHtml(jsonData: { elements: ISlideElement[]; background?: string }): string {
  if (!jsonData.elements || jsonData.elements.length === 0) {
    return '<div style="color: #ffffff; font-size: 24px; text-align: center;">Empty Slide</div>';
  }

  const elementsHtml = jsonData.elements.map(element => {
    const style = {
      position: 'absolute',
      left: `${element.position.x}px`,
      top: `${element.position.y}px`,
      width: `${element.size.width}px`,
      height: `${element.size.height}px`,
      ...element.style,
      ...(element.rotation && { transform: `rotate(${element.rotation}deg)` })
    };

    const styleString = Object.entries(style)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    switch (element.type) {
      case 'text':
        return `<div style="${styleString}">${element.content || ''}</div>`;
      case 'image':
        return `<img src="${element.src}" style="${styleString}; object-fit: contain;" alt="" />`;
      case 'video':
        return `<iframe src="${element.src}" style="${styleString}; border: none;" allowfullscreen></iframe>`;
      default:
        return '';
    }
  }).join('');

  return elementsHtml;
}

/**
 * Convert HTML to JSON slide data for editing
 */
export function htmlToJson(html: string): { elements: ISlideElement[]; background?: string } {
  // This is a simplified parser - in a real implementation, you'd want more sophisticated parsing
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const elements: ISlideElement[] = [];
  let elementId = 0;

  // Parse text elements
  tempDiv.querySelectorAll('div, h1, h2, h3, p, span').forEach(el => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    
    elements.push({
      id: `element-${elementId++}`,
      type: 'text',
      content: el.textContent || '',
      position: { x: rect.left, y: rect.top },
      size: { width: rect.width, height: rect.height },
      style: {
        fontSize: styles.fontSize,
        fontFamily: styles.fontFamily as any,
        color: styles.color,
        textAlign: styles.textAlign as any,
        fontWeight: styles.fontWeight as any,
        fontStyle: styles.fontStyle as any,
        textDecoration: styles.textDecoration as any
      }
    });
  });

  // Parse image elements
  tempDiv.querySelectorAll('img').forEach(el => {
    const rect = el.getBoundingClientRect();
    
    elements.push({
      id: `element-${elementId++}`,
      type: 'image',
      src: (el as HTMLImageElement).src,
      position: { x: rect.left, y: rect.top },
      size: { width: rect.width, height: rect.height }
    });
  });

  return { elements };
}

/**
 * Create a new empty slide with JSON structure
 */
export function createEmptySlide(id: string, title: string): ISlide {
  return {
    id,
    title,
    html: '<div style="color: #ffffff; font-size: 24px; text-align: center;">Empty Slide</div>',
    jsonData: {
      elements: [],
      background: undefined
    },
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Update slide HTML from JSON data
 */
export function updateSlideHtml(slide: ISlide): ISlide {
  if (slide.jsonData) {
    return {
      ...slide,
      html: jsonToHtml(slide.jsonData),
      updatedAt: new Date()
    };
  }
  return slide;
} 