package dev.group2.landmark_be.auth.entity;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users", schema = "app")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class User implements UserDetails, OAuth2User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	// oauth 제공자 - 깃헙, 구글 등
	@Enumerated(EnumType.STRING)
	@Column(name = "oauth_provider", nullable = false)
	private AuthProvider oauthProvider;

	// oauth provider 에서 받은 고유 id
	@Column(name = "oauth_id", unique = true, nullable = false)
	private String oauthId;

	// 깃헙 닉네임
	@Column(name = "username", nullable = false)
	private String username;

	@Column(name = "email", unique = true)
	private String email;

	// jwt에 저장할 수 있는 역할 정의
	@Column(name = "role")
	private String role;

	// oauthAttributes 를 임시 저장하는 필드 (db에 저장되지 않음)
	@Transient
	private Map<String, Object> attributes;

	private String avatarUrl;

	@Override
	public Map<String, Object> getAttributes() {
		return this.attributes;
	}

	@Override
	public String getName() {
		return this.username;
	}

	// UserDetails 인터페이스 구현 (spring security 필수)
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return Collections.singletonList(new SimpleGrantedAuthority(this.role));
	}

	@Override
	public String getPassword() {
		return null;
	}

	@Override
	public String getUsername() {
		return this.username;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return true;
	}

	public User updateOAuthInfo(String username, String email, String avatarUrl) {
		this.username = username;
		this.email = email;
		this.avatarUrl = avatarUrl;
		return this;
	}
}
