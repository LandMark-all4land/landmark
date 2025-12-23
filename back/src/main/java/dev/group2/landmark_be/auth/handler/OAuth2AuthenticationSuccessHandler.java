package dev.group2.landmark_be.auth.handler;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import dev.group2.landmark_be.auth.util.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

	private final JwtTokenProvider jwtTokenProvider;

	@Value("${app.oauth2.redirect-uri}")
	private String redirectUrl;

	@Override
	public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws
		IOException, ServletException {

		OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

		Object idAttribute = oAuth2User.getAttributes().get("id");
		if(idAttribute == null) {
			throw new IllegalStateException("GitHub 사용자의 ID를 찾을 수 없음.");
		}

		Long userId;
		if(idAttribute instanceof Number number) {
			userId = number.longValue();
		} else {
			userId = Long.valueOf(idAttribute.toString());
		}

		String token = jwtTokenProvider.createToken(userId);

		String targetUrl = UriComponentsBuilder.fromUriString(redirectUrl)
			.queryParam("token", token)
			.build().toUriString();

		getRedirectStrategy().sendRedirect(request, response, targetUrl);
	}
}
