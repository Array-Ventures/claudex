export interface LineReview {
  id: string;
  chatId: string;
  filePath: string;
  operationId: string;
  changeType: 'insert' | 'delete' | 'normal';
  lineStart: number;
  lineEnd: number;
  selectedCode: string;
  comment: string;
  createdAt: string;
}
