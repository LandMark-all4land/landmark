package dev.group2.landmark_be.auth.service;

import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import dev.group2.landmark_be.auth.dto.response.GitHubUserInfo;
import dev.group2.landmark_be.auth.dto.response.GoogleUserInfo;
import dev.group2.landmark_be.auth.entity.AuthProvider;
import dev.group2.landmark_be.auth.entity.User;
import dev.group2.landmark_be.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomOauth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

	private final UserRepository userRepository;
	private final ObjectMapper objectMapper;

	private static final String PROVIDER_NAME_GITHUB = "github";
	private static final String PROVIDER_NAME_GOOGLE = "google";
	private static final String GITHUB_OAUTH_EXCEPTION_MESSAGE = "유효하지 않은 GitHub 사용자";
	private static final String GOOGLE_OAUTH_EXCEPTION_MESSAGE = "유효하지 않은 Google 사용자";

	@Override
	@Transactional
	public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

		OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
		OAuth2User oAuth2User = delegate.loadUser(userRequest);

		String registrationId = userRequest.getClientRegistration().getRegistrationId();
		String userNameAttributeName = userRequest.getClientRegistration()
			.getProviderDetails()
			.getUserInfoEndpoint()
			.getUserNameAttributeName();

		Map<String, Object> attributes = oAuth2User.getAttributes();

		User user;

		try {
			String oauthId;
			String username;
			String email;
			String profileImageUrl;
			AuthProvider provider;

			if(PROVIDER_NAME_GITHUB.equals(registrationId)) {
				GitHubUserInfo userInfo = objectMapper.convertValue(attributes, GitHubUserInfo.class);

				oauthId = userInfo.id().toString();
				username = userInfo.login();
				email = userInfo.email();
				profileImageUrl = userInfo.avatarUrl();
				provider = AuthProvider.GITHUB;

				user = saveOrUpdate(userInfo.toEntity(), oauthId, provider, username, email, profileImageUrl, attributes);

			} else if(PROVIDER_NAME_GOOGLE.equals(registrationId)) {
				GoogleUserInfo userInfo = objectMapper.convertValue(attributes, GoogleUserInfo.class);

				oauthId = userInfo.sub();
				username = userInfo.name();
				email = userInfo.email();
				profileImageUrl = userInfo.picture();
				provider = AuthProvider.GOOGLE;

				user = saveOrUpdate(userInfo.toEntity(), oauthId, provider, username, email, profileImageUrl, attributes);

			} else {
				throw new OAuth2AuthenticationException("지원하지 않는 소셜로그인 제공자입니다.");
			}
		} catch (IllegalArgumentException e) {
			throw new OAuth2AuthenticationException("사용자 정보를 분석하는데 문제가 발생했습니다.");
		}

		Map<String, Object> principalAttributes = new java.util.HashMap<>(attributes);
		principalAttributes.put("id", user.getId());

		String role = user.getRole();
		if(!role.startsWith("ROLE_")) role = "ROLE_" + role;

		return new DefaultOAuth2User(
			Collections.singleton(new SimpleGrantedAuthority(role)),
			principalAttributes,
			userNameAttributeName
		);
	}

	private User saveOrUpdate(User newUserEntity, String oauthId, AuthProvider provider,
		String username, String email, String profileImageUrl, Map<String, Object> attributes
	) {
		User user =  userRepository.findByOauthIdAndOauthProvider(oauthId, provider)
			.map(entity -> {
					entity.updateOAuthInfo(username, email, profileImageUrl);
					entity.withAttributes(attributes);
					return entity;
				})
			.orElseGet(() -> {
				newUserEntity.withAttributes(attributes);
				return newUserEntity;
			});
		return userRepository.save(user);
	}
}
