package dev.group2.landmark_be.map.repository;

import java.util.List;

import dev.group2.landmark_be.map.entity.AdmBoundary;
import dev.group2.landmark_be.map.entity.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LandmarkRepository extends JpaRepository<Landmark, Integer> {

	// 특정 admBoundary(시도)에 속한 모든 랜드마크 조회
	List<Landmark> findAllByAdmBoundary(AdmBoundary admBoundary);

	// 랜드마크 이름으로 직접 검색
	List<Landmark> findByNameContainingIgnoreCase(String name);

	List<Landmark> findAllByOrderByProvinceAscNameAsc();
}
