package dev.group2.landmark_be.map.service;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.wololo.jts2geojson.GeoJSONWriter;

import dev.group2.landmark_be.global.dto.PageResponse;
import dev.group2.landmark_be.global.exception.AdmBoundaryNotFoundException;
import dev.group2.landmark_be.global.exception.ErrorCode;
import dev.group2.landmark_be.global.exception.LandmarkNotFoundException;
import dev.group2.landmark_be.map.dto.request.LandmarkCreateRequest;
import dev.group2.landmark_be.map.dto.response.LandmarkResponse;
import dev.group2.landmark_be.map.dto.response.LandmarkWithMonthlyDataResponse;
import dev.group2.landmark_be.map.dto.response.RasterStatsProjection;
import dev.group2.landmark_be.map.entity.AdmBoundary;
import dev.group2.landmark_be.map.entity.Landmark;
import dev.group2.landmark_be.map.repository.AdmBoundaryRepository;
import dev.group2.landmark_be.map.repository.LandmarkRasterRepository;
import dev.group2.landmark_be.map.repository.LandmarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
public class LandmarkService {

	private final LandmarkRepository landmarkRepository;
	private final AdmBoundaryRepository admBoundaryRepository;
	private final LandmarkRasterRepository rasterRepository;
	private final RiskService riskService;

	@Transactional(readOnly = true)
	public List<LandmarkResponse> findAllLandmarks() {
		// 최적화: 필요한 필드만 조회 (adm_boundary의 큰 geom 제외)
		List<Object[]> results = landmarkRepository.findAllLandmarksOptimized();
		return results.stream()
			.map(this::convertFromObjectArray)
			.collect(Collectors.toList());
	}
	public Map<String, Object> getLandmarkWfsData() {
		RestTemplate restTemplate = new RestTemplate();

		// 1. 요청할 URL 만들기 (파라미터를 보기 좋게 분리)
		URI uri = UriComponentsBuilder
			.fromHttpUrl("http://localhost:9090/geoserver/Landmark/ows")
			.queryParam("service", "WFS")
			.queryParam("version", "1.0.0")
			.queryParam("request", "GetFeature")
			.queryParam("typeName", "Landmark:landmark")
			.queryParam("maxFeatures", "50")
			.queryParam("outputFormat", "application/json")
			.build()
			.toUri();

		// 2. GET 요청 보내기 (결과를 Map으로 받으면 JSON 구조가 유지됨)
		try {
			return restTemplate.getForObject(uri, Map.class);
		} catch (Exception e) {
			e.printStackTrace();
			throw new RuntimeException("GeoServer 데이터 가져오기 실패: " + e.getMessage());
		}
	}

	private LandmarkResponse convertFromObjectArray(Object[] row) {
		// row: [id, name, address, latitude, longitude, admCode, admName]
		Long id = ((Number) row[0]).longValue();
		String name = (String) row[1];
		String address = (String) row[2];
		Double latitude = ((Number) row[3]).doubleValue();
		Double longitude = ((Number) row[4]).doubleValue();
		String admCode = (String) row[5];
		String admName = (String) row[6];

		return new LandmarkResponse(
			id,
			name,
			address,
			admCode,
			admName,
			null,  // geomJson 제거
			latitude,
			longitude
		);
	}

	public LandmarkResponse getLandmarkById(Long id) {
		Landmark landmark = landmarkRepository.findByIdWithAdmBoundary(id)
			.orElseThrow(() -> new LandmarkNotFoundException(ErrorCode.LANDMARK_NOT_FOUND));
		return convertToResponse(landmark);
	}

	public List<LandmarkResponse> getLandmarksByAdmCode(String admCode) {
		if(!admBoundaryRepository.existsById(admCode)) {
			throw new AdmBoundaryNotFoundException(ErrorCode.ADM_BOUNDARY_NOT_FOUND);
		}
		List<Landmark> landmarks = landmarkRepository.findAllByAdmCodeWithAdmBoundary(admCode);
		if(landmarks.isEmpty()) {
			return List.of();
		}
		return landmarks.stream()
			.map(this::convertToResponse)
			.collect(Collectors.toList());
	}

	public LandmarkResponse convertToResponse(Landmark entity) {
		// GeoJSON 변환 제거 - 프론트엔드는 위도/경도만 사용
		AdmBoundary admBoundary = entity.getAdmBoundary();
		Point point = entity.getGeom();
		return new LandmarkResponse(
			entity.getId(),
			entity.getName(),
			entity.getAddress(),
			admBoundary.getAdmCode(),
			admBoundary.getAdmName(),
			null,  // geomJson 제거
			point.getY(),	// 위도
			point.getX()	// 경도
		);
	}

	@Transactional
	public LandmarkResponse createLandmark(LandmarkCreateRequest request) {
		// 1. 행정구역 존재 확인
		AdmBoundary admBoundary = admBoundaryRepository.findById(request.admCode())
			.orElseThrow(() -> new AdmBoundaryNotFoundException(ErrorCode.ADM_BOUNDARY_NOT_FOUND));

		// 2. 위도/경도로 Point geometry 생성 (SRID 4326 = WGS84)
		GeometryFactory geometryFactory = new GeometryFactory();
		Point point = geometryFactory.createPoint(new Coordinate(request.longitude(), request.latitude()));
		point.setSRID(4326);

		// 3. Landmark 엔티티 생성 및 저장
		Landmark landmark = Landmark.builder()
			.name(request.name())
			.address(request.address())
			.geom(point)
			.admBoundary(admBoundary)
			.build();

		Landmark savedLandmark = landmarkRepository.save(landmark);

		// 4. Response 변환 후 반환
		return convertToResponse(savedLandmark);
	}

	@Transactional
	public void deleteLandmark(Long landmarkId) {
		if (!landmarkRepository.existsById(landmarkId)) {
			throw new LandmarkNotFoundException(ErrorCode.LANDMARK_NOT_FOUND);
		}
		landmarkRepository.deleteById(landmarkId);
	}

	// 관리자 페이지용: 페이지네이션으로 랜드마크와 1~5월 위험도 데이터 조회
	@Transactional(readOnly = true)
	public PageResponse<LandmarkWithMonthlyDataResponse> getAllLandmarksWithMonthlyData(Integer year, int page, int size) {
		// 1. 전체 랜드마크 개수 조회
		long totalElements = landmarkRepository.countAllLandmarks();

		// 2. 페이지네이션으로 랜드마크 조회 (쿼리 1개)
		Pageable pageable = PageRequest.of(page, size);
		List<Landmark> landmarks = landmarkRepository.findAllWithAdmBoundaryPaginated(pageable);

		// 3. 해당 페이지 랜드마크들의 ID 추출
		List<Long> landmarkIds = landmarks.stream()
			.map(Landmark::getId)
			.collect(Collectors.toList());

		// 4. 해당 랜드마크들의 1~5월 Raster 통계 데이터만 조회 (쿼리 1개)
		List<RasterStatsProjection> allStats = landmarkIds.isEmpty()
			? List.of()
			: rasterRepository.findStatsByLandmarkIdsAndYearForMonths1To5(landmarkIds, year);

		// 5. 데이터를 Map으로 그룹화: landmarkId -> month -> (NDVI, NDMI)
		Map<Long, Map<Integer, Map<String, java.math.BigDecimal>>> statsMap = new HashMap<>();
		for (RasterStatsProjection stat : allStats) {
			statsMap
				.computeIfAbsent(stat.landmarkId(), k -> new HashMap<>())
				.computeIfAbsent(stat.month(), k -> new HashMap<>())
				.put(stat.indexType(), stat.valMean());
		}

		// 6. 각 랜드마크에 대해 위험도 계산 (메모리 내 처리)
		List<LandmarkWithMonthlyDataResponse> content = landmarks.stream()
			.map(landmark -> {
				Map<Integer, LandmarkWithMonthlyDataResponse.MonthlyRiskData> monthlyData = new HashMap<>();
				Map<Integer, Map<String, java.math.BigDecimal>> landmarkStats = statsMap.get(landmark.getId());

				// 1~5월 데이터 처리
				for (int month = 1; month <= 5; month++) {
					if (landmarkStats != null && landmarkStats.containsKey(month)) {
						Map<String, java.math.BigDecimal> monthStats = landmarkStats.get(month);
						java.math.BigDecimal ndvi = monthStats.get("NDVI");
						java.math.BigDecimal ndmi = monthStats.get("NDMI");

						if (ndvi != null && ndmi != null) {
							// 위험도 계산 (RiskService 로직과 동일)
							java.math.BigDecimal riskScore = calculateRiskScore(ndvi, ndmi);
							String riskLevel = getRiskLevel(riskScore);

							monthlyData.put(month, new LandmarkWithMonthlyDataResponse.MonthlyRiskData(
								riskScore.doubleValue(),
								riskLevel
							));
						} else {
							monthlyData.put(month, null);
						}
					} else {
						monthlyData.put(month, null);
					}
				}

				Point point = landmark.getGeom();
				return new LandmarkWithMonthlyDataResponse(
					landmark.getId(),
					landmark.getName(),
					landmark.getAddress(),
					landmark.getAdmBoundary().getAdmCode(),
					landmark.getAdmBoundary().getAdmName(),
					point.getY(),
					point.getX(),
					monthlyData
				);
			})
			.collect(Collectors.toList());

		// 7. PageResponse로 감싸서 반환
		return PageResponse.of(content, page, size, totalElements);
	}

	// 위험도 계산 (RiskService와 동일한 로직)
	private java.math.BigDecimal calculateRiskScore(java.math.BigDecimal ndvi, java.math.BigDecimal ndmi) {
		java.math.BigDecimal W_NDVI = java.math.BigDecimal.valueOf(0.3);
		java.math.BigDecimal W_NDMI = java.math.BigDecimal.valueOf(0.7);
		java.math.BigDecimal NORMALIZATION_FACTOR = java.math.BigDecimal.valueOf(2.0);
		java.math.BigDecimal ONE = java.math.BigDecimal.valueOf(1.0);

		java.math.BigDecimal weightedNdmi = ndmi.multiply(W_NDMI);
		java.math.BigDecimal weightedNdvi = ndvi.multiply(W_NDVI);
		java.math.BigDecimal weightedDifference = weightedNdvi.subtract(weightedNdmi);

		return (ONE.add(weightedDifference))
			.divide(NORMALIZATION_FACTOR, 4, java.math.RoundingMode.HALF_UP);
	}

	// 위험도 레벨 판정 (RiskService와 동일한 로직)
	private String getRiskLevel(java.math.BigDecimal score) {
		if (score.compareTo(java.math.BigDecimal.valueOf(0.7)) >= 0) {
			return "Critical";
		} else if (score.compareTo(java.math.BigDecimal.valueOf(0.5)) > 0) {
			return "Alert";
		} else {
			return "Low";
		}
	}

}
