import { ISlide } from '../types/ISlide';

/**
 * Converts a slide from auto-formatted format to contenteditable format
 */
export const convertToContenteditable = (slide: ISlide): ISlide => {
  // If the slide already has contenteditable elements, return as is
  if (slide.html.includes('contenteditable="true"') || slide.html.includes('editable-element')) {
    return slide;
  }

  // Convert simple HTML to contenteditable format
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = slide.html;
  
  // Extract text content
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  // Create contenteditable element
  const contenteditableHtml = `
    <div class="editable-element" style="top: 50px; left: 50px; width: 600px; height: 100px;">
      <div contenteditable="true" style="color: #ffffff; font-size: 36px;">${textContent}</div>
    </div>
  `;

  return {
    ...slide,
    html: contenteditableHtml
  };
};

/**
 * Converts a slide from contenteditable format to auto-formatted format
 */
export const convertToAutoFormatted = (slide: ISlide): ISlide => {
  // If the slide doesn't have contenteditable elements, return as is
  if (!slide.html.includes('contenteditable="true"') && !slide.html.includes('editable-element')) {
    return slide;
  }

  // Extract text content from contenteditable elements
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = slide.html;
  
  const contenteditableElements = tempDiv.querySelectorAll('[contenteditable="true"]');
  const textContents: string[] = [];
  
  contenteditableElements.forEach(element => {
    const text = element.textContent || '';
    if (text.trim()) {
      textContents.push(text);
    }
  });

  // Create simple HTML with extracted text
  const simpleHtml = textContents.length > 0 
    ? `<h1>${textContents.join('<br/>')}</h1>`
    : '<h1>Empty Slide</h1>';

  return {
    ...slide,
    html: simpleHtml
  };
};

/**
 * Checks if a slide is in contenteditable format
 */
export const isContenteditableSlide = (slide: ISlide): boolean => {
  return slide.html.includes('contenteditable="true"') || slide.html.includes('editable-element');
};

/**
 * Creates a new empty slide in contenteditable format
 */
export const createEmptyContenteditableSlide = (id: string, title: string): ISlide => {
  return {
    id,
    title,
    html: `
      <div class="editable-element" style="top: 50px; left: 50px; width: 600px; height: 100px;">
        <div contenteditable="true" style="color: #ffffff; font-size: 36px;">Click to edit</div>
      </div>
    `,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}; 