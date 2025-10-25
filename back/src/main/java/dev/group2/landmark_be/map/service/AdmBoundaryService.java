package dev.group2.landmark_be.map.service;

import java.util.List;

import org.springframework.stereotype.Service;

import dev.group2.landmark_be.map.dto.response.AdmBoundaryResponse;
import dev.group2.landmark_be.map.entity.AdmBoundary;
import dev.group2.landmark_be.map.repository.AdmBoundaryRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdmBoundaryService {

	private final AdmBoundaryRepository admBoundaryRepository;

	// 시도의 레벨값 : 1
	public List<AdmBoundaryResponse> getAllSidoBoundaries() {
		List<AdmBoundary> entities = admBoundaryRepository.findAllByLevel((short)1);
		return entities.stream()
			.map(this::convertToResponse)
			.toList();
	}

	public AdmBoundaryResponse convertToResponse(AdmBoundary entity) {
		return new AdmBoundaryResponse(
			entity.getAdmCode(),
			entity.getAdmName(),
			entity.getGeom(),
			entity.getLevel()
		);
	}
}
