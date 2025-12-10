package dev.group2.landmark_be.map.service;

import java.net.URI;
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

import dev.group2.landmark_be.global.exception.AdmBoundaryNotFoundException;
import dev.group2.landmark_be.global.exception.ErrorCode;
import dev.group2.landmark_be.global.exception.LandmarkNotFoundException;
import dev.group2.landmark_be.map.dto.request.LandmarkCreateRequest;
import dev.group2.landmark_be.map.dto.response.LandmarkResponse;
import dev.group2.landmark_be.map.entity.AdmBoundary;
import dev.group2.landmark_be.map.entity.Landmark;
import dev.group2.landmark_be.map.repository.AdmBoundaryRepository;
import dev.group2.landmark_be.map.repository.LandmarkRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LandmarkService {

	private final LandmarkRepository landmarkRepository;
	private final AdmBoundaryRepository admBoundaryRepository;

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

}
