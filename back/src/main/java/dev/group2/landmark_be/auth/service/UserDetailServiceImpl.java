package dev.group2.landmark_be.auth.service;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import dev.group2.landmark_be.auth.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserDetailServiceImpl implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String userIdString) throws UsernameNotFoundException {
		try {
			Long userId = Long.parseLong(userIdString);

			return userRepository.findById(userId)
				.orElseThrow(() -> new EntityNotFoundException(userIdString));
		} catch (NumberFormatException e) {
			throw new UsernameNotFoundException("유효하지 않은 사용자 ID");
		} catch (EntityNotFoundException e) {
			throw new UsernameNotFoundException(e.getMessage());
		}
	}
}
