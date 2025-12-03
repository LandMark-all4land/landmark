package dev.group2.landmark_be.global.exception;

import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

import lombok.Getter;

@Getter
public enum ErrorCode {

	// 랜드마크, 행정경계 조회 관련
	LANDMARK_NOT_FOUND(404, "LANDMRK_NOT_FOUND", "랜드마크를 찾을 수 없습니다."),
	ADM_BOUNDARY_NOT_FOUND(404, "ADM_BOUNDARY_NOT_FOUND", "행정경계를 찾을 수 없습니다."),
	DATA_NOT_FOUND(404, "DATA_NOT_FOUND", "해당 연, 월의 NDVI, NDMI를 모두 조회하는데 실패했습니다."),

	// 메모 관련
	NOTE_NOT_FOUND(404, "NOTE_NOT_FOUND", "메모를 찾을 수 없습니다."),

	// 인가 실패
	UNAUTHORIZED_ACCESS(403, "UNAUTHORIZED_ACCESS", "해당 리소스에 접근할 권한이 없습니다."),
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
