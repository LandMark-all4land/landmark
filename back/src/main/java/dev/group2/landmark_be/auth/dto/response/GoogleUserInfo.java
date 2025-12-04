package dev.group2.landmark_be.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import dev.group2.landmark_be.auth.entity.AuthProvider;
import dev.group2.landmark_be.auth.entity.User;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleUserInfo(
	String sub,
	String name,
	String email,
	String picture,
	@JsonProperty("email_verified")
	boolean emailVerified
) {
	public User toEntity() {
		return User.builder()
			.oauthProvider(AuthProvider.GOOGLE)
			.oauthId(sub)
			.username(name)
			.email(email)
			.profileImageUrl(picture)
			.role("ROLE_USER")
			.build();
	}
}
