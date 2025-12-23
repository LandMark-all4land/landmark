package dev.group2.landmark_be.global.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class ApiError {
	private final String message;
	private final String code;
}
