package dev.group2.landmark_be.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.group2.landmark_be.auth.entity.AuthProvider;
import dev.group2.landmark_be.auth.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByOauthProviderAndOauthId(AuthProvider oauthProvider, String oauthId);
}
