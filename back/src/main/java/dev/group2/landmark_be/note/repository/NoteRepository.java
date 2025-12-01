package dev.group2.landmark_be.note.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.group2.landmark_be.note.entity.Note;

public interface NoteRepository extends JpaRepository<Note, Long> {

	List<Note> findAllByLandmarkIdOrderByCreatedAtDesc(Long landmarkId);

	List<Note> findAllByUserIdAndLandmarkIdOrderByCreatedAtDesc(Long userId, Long landmarkId);

	Optional<Note> findByIdAndUserId(Long noteId, Long userId);
}
