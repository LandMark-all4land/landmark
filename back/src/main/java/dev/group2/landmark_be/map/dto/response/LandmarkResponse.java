package dev.group2.landmark_be.map.dto.response;

import org.locationtech.jts.geom.Point;

public record LandmarkResponse(
	Integer id,
	String name,
	String address,
	String admCode,
	String admName,
	Point geom,
	double latitude,	// 위도
	double longitude	// 경도
) {
}
