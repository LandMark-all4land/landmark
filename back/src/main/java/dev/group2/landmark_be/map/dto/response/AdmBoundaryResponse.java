package dev.group2.landmark_be.map.dto.response;

public record AdmBoundaryResponse(
	String admCode,
	String admName,
	String geoJson,
	Short level
) {
}
