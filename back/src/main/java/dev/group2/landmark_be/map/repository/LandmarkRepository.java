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
public interface LandmarkRepository extends JpaRepository<Landmark, Integer> {

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
	Optional<Landmark> findByIdWithAdmBoundary(@Param("id") Integer id);

	// 랜드마크 이름으로 직접 검색
	List<Landmark> findByNameContainingIgnoreCase(String name);

	// List<Landmark> findAllByOrderByProvinceAscNameAsc();
}
