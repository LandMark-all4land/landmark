package dev.group2.landmark_be.map.dto.response;

import java.math.BigDecimal;

import org.locationtech.jts.geom.Polygon;

public record LandmarkRasterResponse(
	Long id,
	Long landmarkId,
	String indexType,	// NDVI, NDMI
	Integer year,
	Integer month,
	String s3Path,		// 래스터 파일 저장 경로

	// 통계값
	BigDecimal valMean,
	BigDecimal valMin,
	BigDecimal valMax,
	BigDecimal valStddev,

	// 3키로 버퍼 영역의 polygon
	String geomJson
) {
}
