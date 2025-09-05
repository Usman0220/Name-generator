
export interface WordNode {
  id: string;
  word: string;
  parentId: string | null;
  position: { x: number; y: number };
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
}
