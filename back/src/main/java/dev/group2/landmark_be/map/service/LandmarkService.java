package dev.group2.landmark_be.map.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import java.util.TreeMap;
import dev.group2.landmark_be.map.dto.LandmarkDto;
import dev.group2.landmark_be.map.entity.Landmark;
import dev.group2.landmark_be.map.repository.LandmarkRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LandmarkService {

	private final LandmarkRepository landmarkRepository;

	public Map<String, List<LandmarkDto>> getLandmarksGroupedByProvince() {
		List<Landmark> landmarks = landmarkRepository.findAllByOrderByProvinceAscNameAsc();

		return landmarks.stream()
			.map(l -> LandmarkDto.builder()
				.id(l.getId())
				.province(l.getProvince())
				.name(l.getName())
				.address(l.getAddress())
				.latitude(l.getLatitude())
				.longitude(l.getLongitude())
				.build())
			.collect(Collectors.groupingBy(LandmarkDto::getProvince,
				TreeMap::new, // 가나다순 정렬
				Collectors.toList()));
	}
}
