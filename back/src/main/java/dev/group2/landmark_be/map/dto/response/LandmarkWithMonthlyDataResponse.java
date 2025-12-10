package dev.group2.landmark_be.map.dto.response;

import java.util.Map;

public record LandmarkWithMonthlyDataResponse(
	Long id,
	String name,
	String address,
	String admCode,
	String admName,
	Double latitude,
	Double longitude,
	// 월별 위험도 데이터 (1~12월)
	Map<Integer, MonthlyRiskData> monthlyData
) {
	public record MonthlyRiskData(
		Double riskScore,
		String riskLevel
	) {}
}
