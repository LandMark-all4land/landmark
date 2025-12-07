// 메모 타입 정의
export interface Note {
  id: number;
  landmarkId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입
export interface NoteResponse {
  success: boolean;
  data: Note | null;
  error: {
    message: string;
    code: string;
  } | null;
}

// 메모 리스트 API 응답 타입
export interface NotesResponse {
  success: boolean;
  data: Note[] | null;
  error: {
    message: string;
    code: string;
  } | null;
}

// 메모 삭제 API 응답 타입
export interface DeleteNoteResponse {
  success: boolean;
  data: null;
  error: {
    message: string;
    code: string;
  } | null;
}
