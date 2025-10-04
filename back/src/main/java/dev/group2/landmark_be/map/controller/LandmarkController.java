package dev.group2.landmark_be.map.controller;
import dev.group2.landmark_be.map.dto.LandmarkDto;
import dev.group2.landmark_be.map.entity.Landmark;
import dev.group2.landmark_be.map.repository.LandmarkRepository;
import dev.group2.landmark_be.map.service.LandmarkService;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173") // ✅ React 개발 서버 허용
@RestController
@RequestMapping("/api/landmarks")
@RequiredArgsConstructor
public class LandmarkController {
	private final LandmarkRepository landmarkRepository;
	private final LandmarkService landmarkService;



	// 전체 랜드마크 조회
	@GetMapping
	public List<Landmark> getAllLandmarks() {
		return landmarkRepository.findAll();
	}

	// 단일 랜드마크 조회
	@GetMapping("/{id}")
	public Landmark getLandmarkById(@PathVariable Long id) {
		return landmarkRepository.findById(id).orElse(null);
	}
	@GetMapping("/grouped")
	public Map<String, List<LandmarkDto>> getGroupedLandmarks() {
		return landmarkService.getLandmarksGroupedByProvince();
	}
}
