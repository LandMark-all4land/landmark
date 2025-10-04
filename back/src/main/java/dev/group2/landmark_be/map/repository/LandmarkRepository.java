package dev.group2.landmark_be.map.repository;

import java.util.List;

import dev.group2.landmark_be.map.entity.Landmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LandmarkRepository extends JpaRepository<Landmark, Long> {
	List<Landmark> findAllByOrderByProvinceAscNameAsc();

}
