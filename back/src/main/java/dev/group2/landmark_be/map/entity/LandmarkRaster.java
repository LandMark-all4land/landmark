package dev.group2.landmark_be.map.entity;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Polygon;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "landmark_raster", schema = "app")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LandmarkRaster {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "landmark_id", nullable = false)
	private Landmark landmark;

	@Column(name = "index_type", length = 10, nullable = false)
	private String indexType;

	@Column(name = "year", nullable = false)
	private Integer year;

	@Column(name = "month", nullable = false)
	private Integer month;

	@Column(name = "s3_path", columnDefinition = "TEXT", nullable = false, unique = true)
	private String s3Path;

	@Column(name = "val_mean", precision = 10, scale = 4)
	private BigDecimal valMean;

	@Column(name = "val_min", precision = 10, scale = 4)
	private BigDecimal valMin;

	@Column(name = "val_max", precision = 10, scale = 4)
	private BigDecimal valMax;

	@Column(name = "val_stddev", precision = 10, scale = 4)
	private BigDecimal valStddev;

	@Column(name = "geom")
	private Polygon geom;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "source_metadata", columnDefinition = "jsonb")
	private JsonNode sourceMetadata;

	@Column(name = "processed_at")
	private ZonedDateTime processedAt;
}
