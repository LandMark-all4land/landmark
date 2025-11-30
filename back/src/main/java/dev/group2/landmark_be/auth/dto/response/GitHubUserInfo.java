package dev.group2.landmark_be.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import dev.group2.landmark_be.auth.entity.AuthProvider;
import dev.group2.landmark_be.auth.entity.User;

public record GitHubUserInfo(
	Long id,

	@JsonProperty("login")
	String githubId,

	@JsonProperty("avatar_url")
	String avatarUrl,
	String email
	) {
	public User toEntity() {
		return User.builder()
			.oauthProvider(AuthProvider.GITHUB)
			.oauthId(String.valueOf(this.id))
			.username(this.githubId())
			.email(this.email)
			.role("ROLE_USER")
			.build();
	}
}
