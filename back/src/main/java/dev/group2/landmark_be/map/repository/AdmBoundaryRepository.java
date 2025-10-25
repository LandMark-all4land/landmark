package dev.group2.landmark_be.map.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dev.group2.landmark_be.map.entity.AdmBoundary;

@Repository
public interface AdmBoundaryRepository extends JpaRepository<AdmBoundary, String> {

	// 시도 코드로 경계 정보 조회
	Optional<AdmBoundary> findByAdmCode(String admCode);

	// 모든 시도 레벨의 행정경계 리스트 찾을 때
	List<AdmBoundary> findAllByLevel(Short level);
}
