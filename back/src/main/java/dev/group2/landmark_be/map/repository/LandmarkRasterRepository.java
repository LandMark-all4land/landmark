package dev.group2.landmark_be.map.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import dev.group2.landmark_be.map.dto.response.RasterSimplifiedProjection;
import dev.group2.landmark_be.map.dto.response.RasterStatsProjection;
import dev.group2.landmark_be.map.entity.LandmarkRaster;

@Repository
public interface LandmarkRasterRepository extends JpaRepository<LandmarkRaster, Integer> {

	List<LandmarkRaster> findAllByLandmark_IdAndYearAndMonth(Integer landmarkId, Integer year, Integer month);

	@Query(value = """
		SELECT
			r.id,
			r.landmark_id as landmarkId,
			r.index_type as indexType,
			r.year,
			r.month,
			r.s3_path as s3Path,
			r.val_mean as valMean,
			r.val_min as valMin,
			r.val_max as valMax,
			r.val_stddev as valStddev,
			ST_AsGeoJSON(ST_Simplify(r.geom, :tolerance)) as geomJson
		FROM
			app.landmark_raster r
		WHERE
			r.landmark_id = :landmarkId
		AND r.year = :year
		AND r.month = :month
		""", nativeQuery = true)
	List<RasterSimplifiedProjection> findSimplifiedByLandmarkIdAndMonth(
		@Param("landmarkId") Long landmarkId,
		@Param("year") Integer year,
		@Param("month") Integer month,
		@Param("tolerance") Double tolerance
	);

	@Query(value = """
		SELECT
			r.landmark_id as landmarkId,
			r.year as year,
			r.month as month,
			r.index_type as indexType,
			r.val_mean as valMean
		FROM
			app.landmark_raster r
		WHERE
			r.landmark_id = :landmarkId
			and r.year = :year
			and r.month = :month
			and r.index_type in ('NDVI', 'NDMI')
		ORDER BY r.index_type
		""", nativeQuery = true)
	List<RasterStatsProjection> findStatsByLandmarkIdAndYearAndMonth(
		@Param("landmarkId") Long landmarkId,
		@Param("year") Integer year,
		@Param("month") Integer month
	);
}
