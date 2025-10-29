package dev.group2.landmark_be.global.exception;

public class LandmarkNotFoundException extends BaseException {
	public LandmarkNotFoundException(ErrorCode errorCode) {
		super(errorCode);
	}
}
