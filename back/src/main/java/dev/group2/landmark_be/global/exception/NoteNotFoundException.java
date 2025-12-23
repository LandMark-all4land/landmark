package dev.group2.landmark_be.global.exception;

public class NoteNotFoundException extends BaseException{
	public NoteNotFoundException(ErrorCode errorCode) {
		super(errorCode);
	}
}
