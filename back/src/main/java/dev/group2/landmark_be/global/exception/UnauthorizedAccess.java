package dev.group2.landmark_be.global.exception;

public class UnauthorizedAccess extends BaseException{
	public UnauthorizedAccess(ErrorCode errorCode) {
		super(errorCode);
	}
}
