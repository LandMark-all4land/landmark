package dev.group2.landmark_be.map.dto.response;

import java.math.BigDecimal;

public record RiskResponse(
	Long landmarkId,
	Integer year,
	Integer month,
	BigDecimal riskScore,
	String riskLevelDescription
) {
}
