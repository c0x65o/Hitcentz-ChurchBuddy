export interface IAssetDeck {
  id: string;
  title: string;
  description?: string;
  slideIds: string[];
  createdAt: Date;
  updatedAt: Date;
} 