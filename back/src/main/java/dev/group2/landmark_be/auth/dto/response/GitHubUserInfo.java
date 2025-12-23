package dev.group2.landmark_be.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import dev.group2.landmark_be.auth.entity.AuthProvider;
import dev.group2.landmark_be.auth.entity.User;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubUserInfo(
	Long id,

	@JsonProperty("login")
	String login,

	@JsonProperty("avatar_url")
	String avatarUrl,
	String email
	) {
	public User toEntity() {
		return User.builder()
			.oauthProvider(AuthProvider.GITHUB)
			.oauthId(String.valueOf(id))
			.username(login)
			.profileImageUrl(avatarUrl)
			.email(email)
			.role("ROLE_USER")
			.build();
	}
}
