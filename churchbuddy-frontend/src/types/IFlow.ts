export interface IFlow {
  id: string;
  title: string;
  listOfLists: string[]; // Array of collection IDs (Songs, Sermons, Asset Decks)
  listOfNotes: string[]; // Array of note strings like "note 1", "note 2", "baptism"
  listOfNotePosition: number[]; // Positions for where notes should appear in the flow
  createdAt: Date;
  updatedAt: Date;
} 