package dev.group2.landmark_be.map.controller;
import dev.group2.landmark_be.global.dto.ApiResponse;
import dev.group2.landmark_be.map.dto.response.LandmarkDto;
import dev.group2.landmark_be.map.dto.response.LandmarkRasterResponse;
import dev.group2.landmark_be.map.dto.response.LandmarkResponse;
import dev.group2.landmark_be.map.entity.Landmark;
import dev.group2.landmark_be.map.repository.LandmarkRepository;
import dev.group2.landmark_be.map.service.LandmarkRasterService;
import dev.group2.landmark_be.map.service.LandmarkService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
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
	private final LandmarkRasterService rasterService;

	// 전체 랜드마크 조회
	@GetMapping
	public List<Landmark> getAllLandmarks() {
		return landmarkRepository.findAll();
	}

	// 단일 랜드마크 조회
	@GetMapping("/{id}")
	public ApiResponse<LandmarkResponse> getLandmarkById(@PathVariable Integer id) {
		LandmarkResponse landmarkResponse = landmarkService.getLandmarkById(id);
		return ApiResponse.success(landmarkResponse);
	}

	// @GetMapping("/grouped")
	// public Map<String, List<LandmarkDto>> getGroupedLandmarks() {
	// 	return landmarkService.getLandmarksGroupedByProvince();
	// }

	// 특정 시도의 랜드마크 리스트 반환
	@GetMapping("/byAdm/{admCode}")
	public ApiResponse<List<LandmarkResponse>> getLandmarksByAdmCode(@PathVariable String admCode) {
		List<LandmarkResponse> landmarks = landmarkService.getLandmarksByAdmCode(admCode);
		return ApiResponse.success(landmarks);
	}

	// 랜드마크 id로 랜드마크 래스터 데이터 조회
	@GetMapping("/{landmarkId}/rasters")
	public ApiResponse<List<LandmarkRasterResponse>> getRastersByLandmarkId(@PathVariable Integer landmarkId) {
		List<LandmarkRasterResponse> rasters = rasterService.getRastersByLandmarkId(landmarkId);
		return ApiResponse.success(rasters);
	}
}
