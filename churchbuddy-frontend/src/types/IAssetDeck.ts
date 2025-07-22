export interface IAssetDeck {
  id: string;
  name: string;
  listOfSlideIDs: string[];
  autoplayBool?: boolean;
  autoplayLoop?: boolean;
  autoplayTimeInS?: number;
  createdAt: Date;
  updatedAt: Date;
} 