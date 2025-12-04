package dev.group2.landmark_be.note.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.group2.landmark_be.auth.entity.User;
import dev.group2.landmark_be.global.dto.ApiResponse;
import dev.group2.landmark_be.note.dto.request.NoteRequest;
import dev.group2.landmark_be.note.dto.response.NoteResponse;
import dev.group2.landmark_be.note.service.NoteService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

	private final NoteService noteService;

	@PostMapping("/{landmarkId}")
	public ApiResponse<NoteResponse> createNote(
		@PathVariable Long landmarkId,
		@RequestBody NoteRequest noteRequest,
		@AuthenticationPrincipal User user
	) {
		NoteResponse note = noteService.saveNote(user.getId(), landmarkId, noteRequest);
		return ApiResponse.success(note);
	}

	@GetMapping("/{landmarkId}")
	public ApiResponse<List<NoteResponse>> findMyNotesByLandmark(
		@PathVariable Long landmarkId,
		@AuthenticationPrincipal User user
	) {
		List<NoteResponse> notes = noteService.findMyNotesByLandmarkId(user.getId(), landmarkId);
		return ApiResponse.success(notes);
	}

	@DeleteMapping("/{noteId}")
	public ApiResponse<Void> deleteNote(
		@PathVariable Long noteId,
		@AuthenticationPrincipal User user
	) {
		noteService.deleteNote(noteId, user.getId());
		return ApiResponse.success(null);
	}
}
