package dev.group2.landmark_be.global.exception;

public class AdmBoundaryNotFoundException extends BaseException {
	public AdmBoundaryNotFoundException(ErrorCode errorCode) {
		super(errorCode);
	}
}
