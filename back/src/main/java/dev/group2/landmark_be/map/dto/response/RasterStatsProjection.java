package dev.group2.landmark_be.map.dto.response;

import java.math.BigDecimal;

public record RasterStatsProjection(
	Long landmarkId,
	Integer year,
	Integer month,
	String indexType,
	BigDecimal valMean
) {
}
