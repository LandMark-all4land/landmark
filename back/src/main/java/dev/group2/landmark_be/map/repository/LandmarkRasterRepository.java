package dev.group2.landmark_be.map.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dev.group2.landmark_be.map.entity.LandmarkRaster;

@Repository
public interface LandmarkRasterRepository extends JpaRepository<LandmarkRaster, Integer> {

	List<LandmarkRaster> findAllByLandmarkId(Integer landmarkId);
}
