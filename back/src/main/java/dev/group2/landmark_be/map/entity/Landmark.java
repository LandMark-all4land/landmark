package dev.group2.landmark_be.map.entity;

import org.locationtech.jts.geom.Point;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "landmark", schema = "app")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Landmark {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(name = "name", nullable = false, columnDefinition = "TEXT")
	private String name;

	@Column(name = "address", length = 300)
	private String address;

	@Column(name = "geom", nullable = false)
	private Point geom;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "adm_code", referencedColumnName = "adm_code")
	private AdmBoundary admBoundary;
}
