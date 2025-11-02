package dev.group2.landmark_be.map.service;

import java.util.List;
import java.util.stream.Collectors;

import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.wololo.jts2geojson.GeoJSONWriter;

import dev.group2.landmark_be.global.exception.AdmBoundaryNotFoundException;
import dev.group2.landmark_be.global.exception.ErrorCode;
import dev.group2.landmark_be.global.exception.LandmarkNotFoundException;
import dev.group2.landmark_be.map.dto.response.LandmarkDto;
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
	private final GeoJSONWriter writer = new GeoJSONWriter();

	// public Map<String, List<LandmarkDto>> getLandmarksGroupedByProvince() {
	// 	List<Landmark> landmarks = landmarkRepository.findAllByOrderByProvinceAscNameAsc();
	//
	// 	return landmarks.stream()
	// 		.map(l -> LandmarkDto.builder()
	// 			.id(l.getId())
	// 			.province(l.getProvince())
	// 			.name(l.getName())
	// 			.address(l.getAddress())
	// 			.latitude(l.getLatitude())
	// 			.longitude(l.getLongitude())
	// 			.build())
	// 		.collect(Collectors.groupingBy(LandmarkDto::getProvince,
	// 			TreeMap::new, // 가나다순 정렬
	// 			Collectors.toList()));
	// }

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
		String geomJson = writer.write(entity.getGeom()).toString();
		AdmBoundary admBoundary = entity.getAdmBoundary();
		Point point = entity.getGeom();
		return new LandmarkResponse(
			entity.getId(),
			entity.getName(),
			entity.getAddress(),
			admBoundary.getAdmCode(),
			admBoundary.getAdmName(),
			geomJson,
			point.getY(),	// 위도
			point.getX()	// 경도
		);
	}
}
