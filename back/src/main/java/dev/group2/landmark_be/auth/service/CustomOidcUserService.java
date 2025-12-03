package dev.group2.landmark_be.auth.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

import dev.group2.landmark_be.auth.dto.response.GoogleUserInfo;
import dev.group2.landmark_be.auth.entity.AuthProvider;
import dev.group2.landmark_be.auth.entity.User;
import dev.group2.landmark_be.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

	private final UserRepository userRepository;
	private final ObjectMapper objectMapper;

	private static final String GOOGLE_OAUTH_EXCEPTION_MESSAGE = "유효하지 않은 Google 사용자";

	@Override
	@Transactional
	public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {

		OidcUserService delegate = new OidcUserService();
		OidcUser oidcUser = delegate.loadUser(userRequest);

		Map<String, Object> attributes = new HashMap<>(oidcUser.getAttributes());

		GoogleUserInfo userInfo;
		try {
			userInfo = objectMapper.convertValue(attributes, GoogleUserInfo.class);
		} catch (IllegalArgumentException e) {
			throw new OAuth2AuthenticationException(GOOGLE_OAUTH_EXCEPTION_MESSAGE);
		}

		User user = saveOrUpdateGoogleUser(userInfo, attributes);

		attributes.put("id", user.getId());

		String role = user.getRole();
		if(!role.startsWith("ROLE_")) role = "ROLE_" + role;

		return new DefaultOidcUser(
			Collections.singleton(new SimpleGrantedAuthority(role)),
			oidcUser.getIdToken(),
			oidcUser.getUserInfo(),
			"sub"
		) {
			@Override
			public Map<String, Object> getAttributes() {
				return attributes;
			}
		};
	}

	private User saveOrUpdateGoogleUser(GoogleUserInfo userInfo, Map<String, Object> attributes) {
		String oauthId = userInfo.sub();
		AuthProvider provider = AuthProvider.GOOGLE;

		User user = userRepository.findByOauthProviderAndOauthId(provider, oauthId)
			.map(entity -> entity.updateOAuthInfo(
				userInfo.name(),
				userInfo.email(),
				userInfo.picture()
			))
			.orElseGet(userInfo::toEntity);

		user.withAttributes(attributes);
		return userRepository.save(user);
	}
}
