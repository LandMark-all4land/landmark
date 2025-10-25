package dev.group2.landmark_be.global.exception;

import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

import lombok.Getter;

@Getter
public enum ErrorCode {

	// 랜드마크, 행정경계 조회 관련
	LANDMARK_NOT_FOUND(404, "LANDMRK_NOT_FOUND", "랜드마크를 찾을 수 없습니다."),
	ADM_BOUNDARY_NOT_FOUND(404, "ADM_BOUNDARY_NOT_FOUND", "행정경계를 찾을 수 없습니다."),
	;

	private final int status;
	private final String code;
	private final String message;

	ErrorCode(int status, String code, String message) {
		this.status = status;
		this.code = code;
		this.message = message;
	}
}
