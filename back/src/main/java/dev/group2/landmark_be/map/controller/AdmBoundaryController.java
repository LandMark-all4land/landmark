package dev.group2.landmark_be.map.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.group2.landmark_be.map.dto.response.AdmBoundaryResponse;
import dev.group2.landmark_be.map.service.AdmBoundaryService;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RequestMapping("/api")
@RestController
public class AdmBoundaryController {

	private final AdmBoundaryService admBoundaryService;

	// 첫 화면에서 표시할 모든 시도 레벨의 행정 경계 목록 조회
	@GetMapping
	public ResponseEntity<List<AdmBoundaryResponse>> getAllAdmBoundaries() {
		List<AdmBoundaryResponse> responseList = admBoundaryService.getAllSidoBoundaries();
		return ResponseEntity.ok(responseList);
	}
}
