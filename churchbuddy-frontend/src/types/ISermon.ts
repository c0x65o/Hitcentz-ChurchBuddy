export interface ISermon {
  id: string;
  title: string;
  description?: string;
  slideIds: string[];
  createdAt: Date;
  updatedAt: Date;
} 