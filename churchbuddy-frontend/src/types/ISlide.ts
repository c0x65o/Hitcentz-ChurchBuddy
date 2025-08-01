export interface ISlideElement {
  id: string;
  type: 'text' | 'image' | 'video';
  content?: string;
  src?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: {
    fontSize?: string;
    fontFamily?: 'Helvetica Neue' | 'Futura' | 'Montserrat' | 'Arial';
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
  };
  rotation?: number;
}

export interface ISlide {
  id: string;
  title: string;
  html: string; // For presentation (converted from JSON)
  jsonData?: { // For editing (JSON structure)
    elements: ISlideElement[];
    background?: string;
  };
  order: number;
  createdAt: Date;
  updatedAt: Date;
} 
