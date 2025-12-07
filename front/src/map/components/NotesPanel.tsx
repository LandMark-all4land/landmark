// src/map/components/NotesPanel.tsx
import React, { useEffect, useState } from "react";
import type { Landmark } from "../types/Landmark";
import type { Note } from "../types/Note";
import { fetchNotes, createNote, deleteNote } from "../api/noteApi";

interface Props {
  landmark: Landmark | null;
}

const NotesPanel: React.FC<Props> = ({ landmark }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 메모 목록 조회
  useEffect(() => {
    if (!landmark) {
      setNotes([]);
      setError(null);
      return;
    }

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchNotes(landmark.id!);
        setNotes(data);
      } catch (e: any) {
        console.error("메모 조회 실패:", e);
        setError(e.message || "메모를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [landmark]);

  // 메모 생성
  const handleCreateNote = async () => {
    if (!landmark || !newNoteContent.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      const newNote = await createNote(landmark.id!, newNoteContent.trim());
      setNotes([...notes, newNote]);
      setNewNoteContent("");
    } catch (e: any) {
      console.error("메모 생성 실패:", e);
      setError(e.message || "메모를 생성하지 못했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  // 메모 삭제
  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm("이 메모를 삭제하시겠습니까?")) return;

    try {
      setError(null);
      await deleteNote(noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (e: any) {
      console.error("메모 삭제 실패:", e);
      setError(e.message || "메모를 삭제하지 못했습니다.");
    }
  };

  // 랜드마크 미선택 상태
  if (!landmark) {
    return (
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          textAlign: "center",
          padding: "16px 8px",
        }}
      >
        랜드마크를 선택하면 메모를 관리할 수 있습니다. 📝
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        height: "100%",
      }}
    >
      {/* 제목 */}
      <div
        style={{
          fontSize: 19,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        메모
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* 메모 입력 영역 */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="새 메모를 입력하세요..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isCreating) {
              handleCreateNote();
            }
          }}
          disabled={isCreating}
          style={{
            flex: 1,
            padding: "8px 12px",
            fontSize: 13,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            outline: "none",
            backgroundColor: isCreating ? "#f9fafb" : "#ffffff",
          }}
        />
        <button
          type="button"
          onClick={handleCreateNote}
          disabled={isCreating || !newNoteContent.trim()}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "#ffffff",
            backgroundColor:
              isCreating || !newNoteContent.trim() ? "#9ca3af" : "#2563eb",
            border: "none",
            borderRadius: 8,
            cursor: isCreating || !newNoteContent.trim() ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {isCreating ? "추가 중..." : "추가"}
        </button>
      </div>

      {/* 메모 목록 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {loading ? (
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              textAlign: "center",
              padding: "16px 8px",
            }}
          >
            메모를 불러오는 중입니다...
          </div>
        ) : notes.length === 0 ? (
          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              textAlign: "center",
              padding: "16px 8px",
            }}
          >
            작성된 메모가 없습니다.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              style={{
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "#111827",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}
              >
                {note.content}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  {new Date(note.createdAt).toLocaleString("ko-KR")}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteNote(note.id)}
                  style={{
                    padding: "4px 8px",
                    fontSize: 11,
                    color: "#dc2626",
                    backgroundColor: "transparent",
                    border: "1px solid #fecaca",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
