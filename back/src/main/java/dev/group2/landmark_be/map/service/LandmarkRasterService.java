package dev.group2.landmark_be.map.service;

import java.util.List;

import org.springframework.stereotype.Service;

import dev.group2.landmark_be.map.dto.response.LandmarkRasterResponse;
import dev.group2.landmark_be.map.entity.LandmarkRaster;
import dev.group2.landmark_be.map.repository.LandmarkRasterRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LandmarkRasterService {

	private final LandmarkRasterRepository rasterRepository;

	public List<LandmarkRasterResponse> getRastersByLandmarkId(Integer landmarkId) {
		List<LandmarkRaster> rasters = rasterRepository.findAllByLandmark_Id(landmarkId);
		return rasters.stream()
			.map(this::convertToResponse)
			.toList();
	}

	public LandmarkRasterResponse convertToResponse(LandmarkRaster entity) {
		return new LandmarkRasterResponse(
			entity.getId(),
			entity.getIndexType(),
			entity.getYear(),
			entity.getMonth(),
			entity.getS3Path(),
			entity.getValMean(),
			entity.getValMin(),
			entity.getValMax(),
			entity.getValStddev(),
			entity.getGeom()
		);
	}
}
