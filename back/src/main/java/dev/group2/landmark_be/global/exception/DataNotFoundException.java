package dev.group2.landmark_be.global.exception;

public class DataNotFoundException extends BaseException{
	public DataNotFoundException(ErrorCode errorCode) {
		super(errorCode);
	}
}
