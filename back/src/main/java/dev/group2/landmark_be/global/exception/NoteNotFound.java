package dev.group2.landmark_be.global.exception;

public class NoteNotFound extends BaseException{
	public NoteNotFound(ErrorCode errorCode) {
		super(errorCode);
	}
}
