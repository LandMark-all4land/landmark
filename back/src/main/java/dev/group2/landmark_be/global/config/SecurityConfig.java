package dev.group2.landmark_be.global.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import dev.group2.landmark_be.auth.filter.JwtAuthenticationFilter;
import dev.group2.landmark_be.auth.handler.OAuth2AuthenticationSuccessHandler;
import dev.group2.landmark_be.auth.service.CustomOauth2UserService;
import dev.group2.landmark_be.auth.service.CustomOidcUserService;
import dev.group2.landmark_be.auth.service.UserDetailServiceImpl;
import dev.group2.landmark_be.auth.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

	private final CustomOauth2UserService customOauth2UserService;
	private final CustomOidcUserService customOidcUserService;
	private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
	private final JwtTokenProvider jwtTokenProvider;
	private final UserDetailServiceImpl userDetailService;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.csrf(csrf -> csrf.disable())
			.cors(cors -> cors.configurationSource(corsConfigurationSource()))
			.httpBasic(httpBasic -> httpBasic.disable())
			.formLogin(formLogin -> formLogin.disable())

			.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

			.addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider, userDetailService), UsernamePasswordAuthenticationFilter.class)

			.authorizeHttpRequests(auth -> auth
				.requestMatchers("/api/auth/**", "/oauth2/**", "/api/landmarks/**", "/api/boundaries/**", "/api/notes/**", "/", "/login", "/login/**").permitAll()
				.anyRequest().authenticated()
			)

			.oauth2Login(oauth2 -> oauth2
				.authorizationEndpoint(authEndpoint -> authEndpoint
					.baseUri("/oauth2/authorization")
				)
				.userInfoEndpoint(userinfo -> userinfo
					.userService(customOauth2UserService)
					.oidcUserService(customOidcUserService)
				)
				.successHandler(oAuth2AuthenticationSuccessHandler)
			);
		return http.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
		configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);
		configuration.setMaxAge(3600L);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
