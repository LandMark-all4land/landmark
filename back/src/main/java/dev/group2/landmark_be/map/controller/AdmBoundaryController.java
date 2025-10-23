package dev.group2.landmark_be.map.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.group2.landmark_be.map.service.AdmBoundaryService;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RequestMapping("/api")
@RestController
public class AdmBoundaryController {
	private final AdmBoundaryService boundaryService;


}
