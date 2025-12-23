package dev.group2.landmark_be.map.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;

import dev.group2.landmark_be.global.exception.DataNotFoundException;
import dev.group2.landmark_be.global.exception.ErrorCode;
import dev.group2.landmark_be.global.exception.LandmarkNotFoundException;
import dev.group2.landmark_be.map.dto.response.RasterStatsProjection;
import dev.group2.landmark_be.map.dto.response.RiskResponse;
import dev.group2.landmark_be.map.repository.LandmarkRasterRepository;
import dev.group2.landmark_be.map.repository.LandmarkRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RiskService {

	private final LandmarkRepository landmarkRepository;
	private final LandmarkRasterRepository rasterRepository;

	private static final BigDecimal NORMALIZATION_FACTOR = BigDecimal.valueOf(2.0);
	private static final BigDecimal ONE = BigDecimal.valueOf(1.0);
	private static final BigDecimal W_NDVI = BigDecimal.valueOf(0.3);
	private static final BigDecimal W_NDMI = BigDecimal.valueOf(0.7);

	public RiskResponse getRiskScoreByMonth(Long landmarkId, Integer year, Integer month) {

		if(!landmarkRepository.existsById(landmarkId)) {
			throw new LandmarkNotFoundException(ErrorCode.LANDMARK_NOT_FOUND);
		}

		List<RasterStatsProjection> stats = rasterRepository.findStatsByLandmarkIdAndYearAndMonth(landmarkId, year, month);
		if(stats.size() < 2) {
			throw new DataNotFoundException(ErrorCode.NOTE_NOT_FOUND);
		}
		return calculateAndConvert(stats, landmarkId, year, month);
	}

	private RiskResponse calculateAndConvert(List<RasterStatsProjection> stats, Long landmarkId, Integer year, Integer month) {
		BigDecimal ndmiMean = getMean(stats, "NDMI");
		BigDecimal ndviMean = getMean(stats, "NDVI");

		BigDecimal weightedNdmi = ndmiMean.multiply(W_NDMI);
		BigDecimal weightedNdvi = ndviMean.multiply(W_NDVI);

		BigDecimal weightedDifference = weightedNdvi.subtract(weightedNdmi);
		BigDecimal riskScore = (ONE.add(weightedDifference)).divide(NORMALIZATION_FACTOR, 4, RoundingMode.HALF_UP);

		String description = getRiskLevelDescription(riskScore);

		return new RiskResponse(
			landmarkId,
			year,
			month,
			riskScore,
			description
		);
	}

	private BigDecimal getMean(List<RasterStatsProjection> stats, String indexType) {
		return stats.stream()
			.filter(state -> indexType.equals(state.indexType()))
			.findFirst()
			.map(RasterStatsProjection::valMean)
			.orElse(BigDecimal.ZERO);
	}

	private String getRiskLevelDescription(BigDecimal score) {
		if(score.compareTo(BigDecimal.valueOf(0.7)) >= 0) {
			return "Critical";		// 위험
		} else if(score.compareTo(BigDecimal.valueOf(0.5)) > 0) {
			return "Alert";			// 주의
		} else {
			return "Low";			// 낮음
		}
	}
}
