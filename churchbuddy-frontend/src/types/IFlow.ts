export interface IFlow {
  id: string;
  title: string;
  flowItems: Array<{
    type: 'collection' | 'note';
    id: string;
    title: string;
    note?: string;
    order: number; // Simple order number - the order the user created
  }>;
  createdAt: Date;
  updatedAt: Date;
} 