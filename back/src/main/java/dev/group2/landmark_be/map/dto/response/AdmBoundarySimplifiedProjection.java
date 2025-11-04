package dev.group2.landmark_be.map.dto.response;

public record AdmBoundarySimplifiedProjection(
	String admCode,
	String admName,
	Short level,
	String geomJson
) {
}
