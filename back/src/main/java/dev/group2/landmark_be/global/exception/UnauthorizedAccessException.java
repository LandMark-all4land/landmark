package dev.group2.landmark_be.global.exception;

public class UnauthorizedAccessException extends BaseException{
	public UnauthorizedAccessException(ErrorCode errorCode) {
		super(errorCode);
	}
}
