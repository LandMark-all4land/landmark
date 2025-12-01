package dev.group2.landmark_be.auth.util;

import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

	private final Key key;

	public JwtTokenProvider(@Value("${jwt.secret}") String secretKey) {
		byte[] keyBytes = Decoders.BASE64.decode(secretKey);
		this.key = Keys.hmacShaKeyFor(keyBytes);
	}

	// 토큰 만료 : 1시간
	private final long tokenValidityInMilliseconds = 3600000;

	public String createToken(Long userId) {
		Claims claims = Jwts.claims().setSubject(userId.toString());
		Date now = new Date();
		Date validity = new Date(now.getTime() + tokenValidityInMilliseconds);

		return Jwts.builder()
			.setClaims(claims)
			.setIssuedAt(now)
			.setExpiration(validity)
			.signWith(key, SignatureAlgorithm.HS256)
			.compact();
	}

	public Long getUserIdFromToken(String token) {
		return Long.parseLong(getClaims(token).getBody().getSubject());
	}

	public boolean validateToken(String token) {
		try {
			getClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	private Jws<Claims> getClaims(String token) {
		return Jwts.parserBuilder()
			.setSigningKey(key)
			.build()
			.parseClaimsJws(token);
	}
}
