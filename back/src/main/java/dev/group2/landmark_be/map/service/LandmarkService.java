package dev.group2.landmark_be.map.service;

import java.util.List;
import java.util.stream.Collectors;

import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.group2.landmark_be.global.exception.AdmBoundaryNotFoundException;
import dev.group2.landmark_be.global.exception.ErrorCode;
import dev.group2.landmark_be.global.exception.LandmarkNotFoundException;
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
}
