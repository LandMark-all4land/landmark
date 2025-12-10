package dev.group2.landmark_be.map.repository;

import java.util.List;
import java.util.Optional;

import dev.group2.landmark_be.map.entity.AdmBoundary;
import dev.group2.landmark_be.map.entity.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.web.servlet.tags.form.SelectTag;

@Repository
public interface LandmarkRepository extends JpaRepository<Landmark, Long> {

	// 모든 랜드마크 조회 (admCode, admName만 필요 - geom 제외)
	@Query(value = """
		SELECT l.id, l.name, l.address,
		       ST_Y(l.geom) as latitude,
		       ST_X(l.geom) as longitude,
		       a.adm_code, a.adm_name
		FROM app.landmark l
		JOIN app.adm_boundary a ON l.adm_code = a.adm_code
		""", nativeQuery = true)
	List<Object[]> findAllLandmarksOptimized();

	// 특정 admBoundary(시도)에 속한 모든 랜드마크 조회
	@Query(value = """
		SELECT l
		FROM Landmark l
		JOIN FETCH l.admBoundary a
		WHERE a.admCode = :admCode
		""")
	List<Landmark> findAllByAdmCodeWithAdmBoundary(@Param("admCode") String admCode);

	@Query(value = """
		SELECT l
		FROM Landmark l
		JOIN FETCH l.admBoundary 
		WHERE l.id = :id
		""")
	Optional<Landmark> findByIdWithAdmBoundary(@Param("id") Long id);

	// 랜드마크 이름으로 직접 검색
	List<Landmark> findByNameContainingIgnoreCase(String name);

	// 관리자 페이지용: 모든 랜드마크를 AdmBoundary와 함께 조회 (N+1 방지)
	@Query("""
		SELECT l
		FROM Landmark l
		JOIN FETCH l.admBoundary
		ORDER BY l.id
		""")
	List<Landmark> findAllWithAdmBoundary();

	// 페이지네이션: 특정 페이지의 랜드마크만 조회 (N+1 방지)
	@Query(value = """
		SELECT l
		FROM Landmark l
		JOIN FETCH l.admBoundary
		ORDER BY l.id
		""")
	List<Landmark> findAllWithAdmBoundaryPaginated(org.springframework.data.domain.Pageable pageable);

	// 전체 랜드마크 개수
	@Query("SELECT COUNT(l) FROM Landmark l")
	long countAllLandmarks();
}
