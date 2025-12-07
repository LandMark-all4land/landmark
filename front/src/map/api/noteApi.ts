import apiClient from "../../api/apiClient";
import type { Note, NoteResponse, NotesResponse, DeleteNoteResponse } from "../types/Note";

// 특정 랜드마크의 메모 목록 조회
export const fetchNotes = async (landmarkId: number): Promise<Note[]> => {
  try {
    const res = await apiClient.get<NotesResponse>(`/api/notes/${landmarkId}`);

    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }

    console.error("⚠️ 예상치 못한 응답:", res.data);
    return [];
  } catch (error: any) {
    console.error("API 호출 실패 (메모 목록 조회):", error);
    throw new Error(error.response?.data?.error?.message || "메모를 불러오지 못했습니다.");
  }
};

// 메모 생성
export const createNote = async (
  landmarkId: number,
  content: string
): Promise<Note> => {
  try {
    const res = await apiClient.post<NoteResponse>(
      `/api/notes/${landmarkId}`,
      { content }
    );

    if (res.data?.success && res.data.data) {
      return res.data.data;
    }

    throw new Error("메모 생성에 실패했습니다.");
  } catch (error: any) {
    console.error("API 호출 실패 (메모 생성):", error);
    throw new Error(error.response?.data?.error?.message || "메모를 생성하지 못했습니다.");
  }
};

// 메모 삭제
export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    const res = await apiClient.delete<DeleteNoteResponse>(`/api/notes/${noteId}`);

    if (!res.data?.success) {
      throw new Error("메모 삭제에 실패했습니다.");
    }
  } catch (error: any) {
    console.error("API 호출 실패 (메모 삭제):", error);
    throw new Error(error.response?.data?.error?.message || "메모를 삭제하지 못했습니다.");
  }
};
