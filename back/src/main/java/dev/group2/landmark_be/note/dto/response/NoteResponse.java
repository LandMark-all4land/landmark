package dev.group2.landmark_be.note.dto.response;

import java.time.LocalDateTime;

public record NoteResponse(
	Long id,
	Long landmarkId,
	Long userId,
	String content,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {}
