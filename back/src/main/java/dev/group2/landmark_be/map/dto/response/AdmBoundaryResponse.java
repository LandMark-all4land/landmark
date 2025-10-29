package dev.group2.landmark_be.map.dto.response;

import org.locationtech.jts.geom.MultiPolygon;

public record AdmBoundaryResponse(
	String admCode,
	String admName,
	String geoJson,
	Short level
) {
}
