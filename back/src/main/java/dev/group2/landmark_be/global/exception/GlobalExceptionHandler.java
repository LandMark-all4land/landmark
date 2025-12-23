package dev.group2.landmark_be.global.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import dev.group2.landmark_be.global.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(BaseException.class)
	public ResponseEntity<ApiResponse<Void>> handleBaseException(BaseException ex) {
		ApiResponse<Void> response = ApiResponse.failure(ex.getMessage(), ex.getErrorCode().getCode());
		return ResponseEntity.status(ex.getErrorCode().getStatus()).body(response);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<Void>> handleUnknownException(Exception ex) {
		log.error("알 수 없는 오류가 발생했습니다.", ex);
		ApiResponse<Void> response = ApiResponse.failure("알 수 없는 서버 오류가 발생했습니다.", "INTERNAL_SERVER_ERROR");
		return ResponseEntity.status(500).body(response);
	}
}
