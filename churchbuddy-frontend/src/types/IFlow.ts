export interface IFlow {
  id: string;
  title: string;
  description?: string;
  sermonIds: string[];
  assetDeckIds: string[];
  songIds: string[];
  createdAt: Date;
  updatedAt: Date;
} 