package dev.group2.landmark_be.note.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.group2.landmark_be.auth.entity.User;
import dev.group2.landmark_be.auth.repository.UserRepository;
import dev.group2.landmark_be.global.exception.ErrorCode;
import dev.group2.landmark_be.global.exception.NoteNotFoundException;
import dev.group2.landmark_be.global.exception.UnauthorizedAccessException;
import dev.group2.landmark_be.note.dto.request.NoteRequest;
import dev.group2.landmark_be.note.dto.response.NoteResponse;
import dev.group2.landmark_be.note.entity.Note;
import dev.group2.landmark_be.note.repository.NoteRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NoteService {

	private final NoteRepository noteRepository;
	private final UserRepository userRepository;

	@Transactional
	public NoteResponse saveNote(Long userId, Long landmarkId, NoteRequest noteRequest) {
		User user = userRepository.findById(userId)
			.orElseThrow(() -> new UnauthorizedAccessException(ErrorCode.UNAUTHORIZED_ACCESS));

		Note note = Note.builder()
			.user(user)
			.landmarkId(landmarkId)
			.content(noteRequest.content())
			.createdAt(LocalDateTime.now())
			.updatedAt(LocalDateTime.now())
			.build();

		Note savedNote = noteRepository.save(note);
		return convertToResponse(savedNote);
	}

	@Transactional
	public List<NoteResponse> findMyNotesByLandmarkId(Long userId, Long landmarkId) {
		List<Note> notes = noteRepository.findAllByUser_IdAndLandmarkIdOrderByCreatedAtDesc(userId, landmarkId);
		return notes.stream()
			.map(this::convertToResponse)
			.collect(Collectors.toList());
	}

	@Transactional
	public void deleteNote(Long noteId, Long currentUserId) {
		Note note = noteRepository.findById(noteId)
			.orElseThrow(() -> new NoteNotFoundException(ErrorCode.NOTE_NOT_FOUND));

		if(!Objects.equals(note.getUserId(), currentUserId)) {
			throw new UnauthorizedAccessException(ErrorCode.UNAUTHORIZED_ACCESS);
		}
		noteRepository.delete(note);
	}

	private NoteResponse convertToResponse(Note note) {
		return new NoteResponse(
			note.getId(),
			note.getLandmarkId(),
			note.getUserId(),
			note.getContent(),
			note.getCreatedAt(),
			note.getUpdatedAt()
		);
	}
}
