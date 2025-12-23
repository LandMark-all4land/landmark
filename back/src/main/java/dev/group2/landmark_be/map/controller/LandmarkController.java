package dev.group2.landmark_be.map.controller;
import dev.group2.landmark_be.global.dto.ApiResponse;
import dev.group2.landmark_be.map.dto.response.LandmarkRasterResponse;
import dev.group2.landmark_be.map.dto.response.LandmarkResponse;
import dev.group2.landmark_be.map.dto.response.RiskResponse;
import dev.group2.landmark_be.map.repository.LandmarkRepository;
import dev.group2.landmark_be.map.service.LandmarkRasterService;
import dev.group2.landmark_be.map.service.LandmarkService;
import dev.group2.landmark_be.map.service.RiskService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/landmarks")
@RequiredArgsConstructor
@Validated
public class LandmarkController {

	private final LandmarkService landmarkService;
	private final LandmarkRasterService rasterService;
	private final RiskService riskService;

	// 전체 랜드마크 조회
	@GetMapping
	public ApiResponse<Map<String, Object>> getAllLandmarks() {
		// 1. 서비스에서 GeoJSON(Map) 데이터를 받아옴
		Map<String, Object> geoJsonData = landmarkService.getLandmarkWfsData();

		// 2. ApiResponse.success()에 그대로 담아서 리턴
		return ApiResponse.success(geoJsonData);
	}

	// 단일 랜드마크 조회
	@GetMapping("/{landmarkId}")
	public ApiResponse<LandmarkResponse> getLandmarkById(@PathVariable("landmarkId") Long id) {
		LandmarkResponse landmarkResponse = landmarkService.getLandmarkById(id);
		return ApiResponse.success(landmarkResponse);
	}

	// 특정 시도의 랜드마크 리스트 반환
	@GetMapping("/byAdm/{admCode}")
	public ApiResponse<List<LandmarkResponse>> getLandmarksByAdmCode(@PathVariable String admCode) {
		List<LandmarkResponse> landmarks = landmarkService.getLandmarksByAdmCode(admCode);
		return ApiResponse.success(landmarks);
	}

	// 랜드마크 id로 랜드마크 래스터 데이터 조회
	@GetMapping("/{landmarkId}/rasters")
	public ApiResponse<List<LandmarkRasterResponse>> getRastersByLandmarkId(
		@PathVariable Long landmarkId,
		@RequestParam @NotNull @Min(2000) Integer year,
		@RequestParam @NotNull @Min(1) @Max(12) Integer month
	) {
		List<LandmarkRasterResponse> rasters = rasterService.getRastersByLandmarkIdAndMonth(landmarkId, year, month);
		return ApiResponse.success(rasters);
	}

	@GetMapping("/{landmarkId}/risk")
	public ApiResponse<RiskResponse> getLandmarkRiskByMonth(
		@PathVariable Long landmarkId,
		@RequestParam @NotNull @Min(2000) Integer year,
		@RequestParam @NotNull @Min(1) @Max(12) Integer month
	) {
		RiskResponse risk = riskService.getRiskScoreByMonth(landmarkId, year, month);
		return ApiResponse.success(risk);
	}


}
