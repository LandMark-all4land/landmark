package dev.group2.landmark_be.map.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import dev.group2.landmark_be.map.dto.response.RasterSimplifiedProjection;
import dev.group2.landmark_be.map.entity.LandmarkRaster;

@Repository
public interface LandmarkRasterRepository extends JpaRepository<LandmarkRaster, Integer> {

	List<LandmarkRaster> findAllByLandmark_IdAndYearAndMonth(Integer landmarkId, Integer year, Integer month);

	@Query(value = """
		SELECT
			r.id,
			r.landmark_id,
			r.index_type,
			r.year,
			r.month,
			r.s3_path,
			r.val_mean,
			r.val_min,
			r.val_max,
			r.val_stddev,
			ST_AsGeoJSON(ST_Simplify(r.geom, :tolerance)) as geom_json
		FROM
			app.landmark_raster r
		WHERE
			r.landmark_id = :landmarkId
		AND r.year = :year
		AND r.month = :month
		""", nativeQuery = true)
	List<RasterSimplifiedProjection> findSimplifiedByLandmarkIdAndMonth(
		@Param("landmarkId") Integer landmarkId,
		@Param("year") Integer year,
		@Param("month") Integer month,
		@Param("tolerance") Double tolerance
	);
}
