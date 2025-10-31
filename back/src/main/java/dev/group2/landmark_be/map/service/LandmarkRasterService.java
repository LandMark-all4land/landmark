package dev.group2.landmark_be.map.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.wololo.jts2geojson.GeoJSONWriter;

import dev.group2.landmark_be.map.dto.response.LandmarkRasterResponse;
import dev.group2.landmark_be.map.dto.response.RasterSimplifiedProjection;
import dev.group2.landmark_be.map.entity.LandmarkRaster;
import dev.group2.landmark_be.map.repository.LandmarkRasterRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LandmarkRasterService {

	private final LandmarkRasterRepository rasterRepository;
	private final GeoJSONWriter writer = new GeoJSONWriter();

	private static final Double RASTER_SIMPLIFY_TOLERANCE = 0.0005;

	public List<LandmarkRasterResponse> getRastersByLandmarkIdAndMonth(Integer landmarkId, Integer year, Integer month) {
		List<RasterSimplifiedProjection> projections = rasterRepository.findSimplifiedByLandmarkIdAndMonth(landmarkId, year, month, RASTER_SIMPLIFY_TOLERANCE);
		return projections.stream()
			.map(this::convertToResponse)
			.toList();
	}

	public LandmarkRasterResponse convertToResponse(RasterSimplifiedProjection projection) {
		return new LandmarkRasterResponse(
			projection.id(),
			projection.landmarkId(),
			projection.indexType(),
			projection.year(),
			projection.month(),
			projection.s3Path(),
			projection.valMean(),
			projection.valMin(),
			projection.valMax(),
			projection.valStddev(),
			projection.geomJson()
		);
	}
}
