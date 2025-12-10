package dev.group2.landmark_be.map.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LandmarkCreateRequest(
	@NotBlank(message = "랜드마크 이름은 필수입니다")
	String name,

	@NotBlank(message = "주소는 필수입니다")
	String address,

	@NotNull(message = "위도는 필수입니다")
	Double latitude,

	@NotNull(message = "경도는 필수입니다")
	Double longitude,

	@NotBlank(message = "행정구역 코드는 필수입니다")
	String admCode
) {
}
