package dev.group2.landmark_be.map.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "landmark")
@Getter
@Setter
@NoArgsConstructor
public class Landmark {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	private String province;     // 도
	private String name;         // 이름
	private String address;      // 도로명주소
	private double latitude;     // 위도
	private double longitude;    // 경도
}
