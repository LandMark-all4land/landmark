package dev.group2.landmark_be.map.service;

import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.wololo.geojson.GeoJSON;
import org.wololo.jts2geojson.GeoJSONWriter;

import dev.group2.landmark_be.map.dto.response.AdmBoundaryResponse;
import dev.group2.landmark_be.map.dto.response.AdmBoundarySimplifiedProjection;
import dev.group2.landmark_be.map.entity.AdmBoundary;
import dev.group2.landmark_be.map.repository.AdmBoundaryRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdmBoundaryService {

	private final AdmBoundaryRepository admBoundaryRepository;
	private final GeoJSONWriter writer = new GeoJSONWriter();

	// 시도의 레벨값 : 1
	static final Short SIDO_LEVEL = 1;

	@Transactional(readOnly = true)
	public List<AdmBoundaryResponse> getAllSidoBoundaries() {
		Double tolerance = 0.005;
		List<AdmBoundarySimplifiedProjection> results = admBoundaryRepository.findAllSimplifiedBoundaries(tolerance);

		return results.stream()
			.map(projection -> new AdmBoundaryResponse(
				projection.admCode(),
				projection.admName(),
				projection.geomJson(),
				projection.level()
			))
			.toList();
	}

	public AdmBoundaryResponse convertToResponse(AdmBoundary entity) {
		GeoJSON geoJSON = writer.write(entity.getGeom());
		String geomJson = geoJSON.toString();
		return new AdmBoundaryResponse(
			entity.getAdmCode(),
			entity.getAdmName(),
			geomJson,
			entity.getLevel()
		);
	}
}
