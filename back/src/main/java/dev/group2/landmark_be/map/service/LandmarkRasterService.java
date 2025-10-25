package dev.group2.landmark_be.map.service;

import org.springframework.stereotype.Service;

import dev.group2.landmark_be.map.dto.response.LandmarkRasterResponse;
import dev.group2.landmark_be.map.entity.LandmarkRaster;

@Service
public class LandmarkRasterService {

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
