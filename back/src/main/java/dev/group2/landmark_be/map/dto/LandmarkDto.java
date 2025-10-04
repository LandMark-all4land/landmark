package dev.group2.landmark_be.map.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data  // getter, setter, toString 자동 생성
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandmarkDto {
	private Integer id;
	private String province;
	private String name;
	private String address;
	private double latitude;
	private double longitude;
}
