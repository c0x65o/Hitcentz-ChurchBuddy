export interface ISlide {
  id: string;
  title: string;
  html: string;
  editData?: {
    elements: Array<{
      id: string;
      type: 'text' | 'image' | 'video';
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex: number;
      text?: string;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      backgroundColor?: string;
      textAlign?: 'left' | 'center' | 'right';
      imageUrl?: string;
      videoUrl?: string;
    }>;
    background?: string;
  };
  order: number;
  createdAt: Date;
  updatedAt: Date;
} 
