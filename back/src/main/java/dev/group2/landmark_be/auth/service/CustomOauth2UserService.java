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
import dev.group2.landmark_be.auth.entity.AuthProvider;
import dev.group2.landmark_be.auth.entity.User;
import dev.group2.landmark_be.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomOauth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

	private final UserRepository userRepository;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	@Transactional
	public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {

		OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
		OAuth2User oAuth2User = delegate.loadUser(userRequest);

		// String registrationId = userRequest.getClientRegistration().getRegistrationId();

		String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();
		Map<String, Object> attributes = oAuth2User.getAttributes();

		// GitHubUserInfo userInfo;
		// try {
		// 	userInfo = objectMapper.convertValue(attributes, GitHubUserInfo.class);
		// } catch (IllegalArgumentException e) {
		// 	throw new OAuth2AuthenticationException(e.getMessage());
		// }
		//
		// User user = saveOrUpdate(userInfo, attributes);
		//
		// return new DefaultOAuth2User(
		// 	Collections.singleton(new SimpleGrantedAuthority(user.getRole())),
		// 	user.getAttributes(),
		// 	userNameAttributeName
		// );

		return new DefaultOAuth2User(
			Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
			attributes,
			userNameAttributeName
		);
	}

	private User saveOrUpdate(GitHubUserInfo userInfo, Map<String, Object> attributes) {
		String oauthIdString = String.valueOf(userInfo.id());
		AuthProvider provider = AuthProvider.GITHUB;

		User user = userRepository.findByOauthIdAndOauthProvider(oauthIdString, provider)
			.map(entity -> entity.updateOAuthInfo(userInfo.githubId(), userInfo.email(),attributes))
			.orElse(userInfo.toEntity());

		return userRepository.save(user);
	}
}
