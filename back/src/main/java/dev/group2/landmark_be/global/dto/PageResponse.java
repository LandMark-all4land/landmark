package dev.group2.landmark_be.global.dto;

import java.util.List;

public record PageResponse<T>(
	List<T> content,
	int currentPage,
	int pageSize,
	long totalElements,
	int totalPages,
	boolean hasNext,
	boolean hasPrevious
) {
	public static <T> PageResponse<T> of(List<T> content, int page, int size, long total) {
		int totalPages = (int) Math.ceil((double) total / size);
		return new PageResponse<>(
			content,
			page,
			size,
			total,
			totalPages,
			page < totalPages - 1,
			page > 0
		);
	}
}
