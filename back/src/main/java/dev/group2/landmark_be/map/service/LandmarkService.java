package dev.group2.landmark_be.map.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import java.util.TreeMap;

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

	public LandmarkResponse getLandmarkById(Integer id) {
		Landmark landmark = landmarkRepository.findById(id)
			.orElseThrow(() -> new LandmarkNotFoundException(ErrorCode.LANDMARK_NOT_FOUND));
		return convertToResponse(landmark);
	}

	public List<LandmarkResponse> getLandmarksByAdmCode(String admCode) {
		AdmBoundary admBoundary = admBoundaryRepository.findByAdmCode(admCode)
			.orElseThrow(() -> new AdmBoundaryNotFoundException(ErrorCode.ADM_BOUNDARY_NOT_FOUND));
		List<Landmark> landmarks = landmarkRepository.findAllByAdmBoundary(admBoundary);
		return landmarks.stream()
			.map(this::convertToResponse)
			.collect(Collectors.toList());
	}

	public LandmarkResponse convertToResponse(Landmark landmark) {
		AdmBoundary admBoundary = landmark.getAdmBoundary();
		Point point = landmark.getGeom();
		return new LandmarkResponse(
			landmark.getId(),
			landmark.getName(),
			landmark.getAddress(),
			admBoundary.getAdmCode(),
			admBoundary.getAdmName(),
			point,
			point.getY(),	// 위도
			point.getX()	// 경도
		);
	}
}
