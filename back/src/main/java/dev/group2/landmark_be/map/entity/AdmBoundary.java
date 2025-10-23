package dev.group2.landmark_be.map.entity;

import org.geolatte.geom.MultiPolygon;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "adm_boundary", schema = "app")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AdmBoundary {
	@Id
	@Column(name = "adm_code", length = 12)
	private String admCode;

	@Column(name = "adm_name", nullable = false, columnDefinition = "TEXT")
	private String admName;

	@Column(name = "level", nullable = false)
	private Short level;

	@Column(name = "geom", nullable = false)
	private MultiPolygon geom;
}
