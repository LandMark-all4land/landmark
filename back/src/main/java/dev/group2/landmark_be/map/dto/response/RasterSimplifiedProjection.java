package dev.group2.landmark_be.map.dto.response;

import java.math.BigDecimal;

public record RasterSimplifiedProjection(
	Long id,
	Long landmarkId,
	String indexType,
	Integer year,
	Integer month,
	String s3Path,
	BigDecimal valMean,
	BigDecimal valMin,
	BigDecimal valMax,
	BigDecimal valStddev,
	String geomJson
) {
}
