package dev.group2.landmark_be.auth.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.view.RedirectView;

@Controller
@RequestMapping("/api/auth")
public class AuthController {

	@GetMapping("/github")
	public RedirectView redirectToGitHubAuth() {
		return new RedirectView("/oauth2/authorization/github");
	}

	@GetMapping("/google")
	public RedirectView redirectToGoogleAuth() {
		return new RedirectView("/oauth2/authorization/google");
	}
}
