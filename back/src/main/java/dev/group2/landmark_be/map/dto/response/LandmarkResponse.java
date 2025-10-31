package dev.group2.landmark_be.map.dto.response;

public record LandmarkResponse(
	Integer id,
	String name,
	String address,
	String admCode,
	String admName,
	String geomJson,
	double latitude,	// 위도
	double longitude	// 경도
) {
}
