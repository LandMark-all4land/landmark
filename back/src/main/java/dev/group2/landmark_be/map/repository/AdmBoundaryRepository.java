package dev.group2.landmark_be.map.repository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import dev.group2.landmark_be.map.dto.response.AdmBoundarySimplifiedProjection;
import dev.group2.landmark_be.map.entity.AdmBoundary;

@Repository
public interface AdmBoundaryRepository extends JpaRepository<AdmBoundary, String> {

	// 시도 코드로 경계 정보 조회
	Optional<AdmBoundary> findByAdmCode(String admCode);

	// 모든 시도 레벨의 행정경계 리스트 찾을 때
	@Query(value = """
		SELECT
			a.adm_code,
			a.adm_name,
			a.level,
			ST_AsGeoJSON(ST_Simplify(a.geom, :tolerance)) as geom_json
		FROM
			app.adm_boundary a
		WHERE
			a.level = 1
		""", nativeQuery = true)
	List<AdmBoundarySimplifiedProjection> findAllSimplifiedBoundaries(@Param("tolerance") Double tolerance);

	// tolerance: 오차 허용 거리, 상세 뷰를 위해서는 0.0001정도로 정밀하게 잡는 게 좋지만, 전체 뷰와 속도를 위해서 0.005로 설정
}
