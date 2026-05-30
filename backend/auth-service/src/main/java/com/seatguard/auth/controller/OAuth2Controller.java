package com.seatguard.auth.controller;

import com.seatguard.auth.dto.AuthResponse;
import com.seatguard.auth.service.OAuth2Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/oauth2")
public class OAuth2Controller {

    private final OAuth2Service oAuth2Service;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String redirectUri;

    @Value("${spring.security.oauth2.client.registration.google.scope:email,profile}")
    private String scope;

    @Value("${oauth2.frontend-url:http://206.189.47.198:3001}")
    private String frontendUrl;

    public OAuth2Controller(OAuth2Service oAuth2Service) {
        this.oAuth2Service = oAuth2Service;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Redirect to Google consent screen
     */
    @GetMapping("/authorization/google")
    public void authorizeGoogle(HttpServletResponse response) throws IOException {
        if (clientId == null || clientId.isBlank()) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "GOOGLE_CLIENT_ID not configured");
            return;
        }

        String googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?"
                + "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&response_type=code"
                + "&scope=" + URLEncoder.encode(scope, StandardCharsets.UTF_8)
                + "&access_type=offline"
                + "&prompt=consent";

        response.sendRedirect(googleAuthUrl);
    }

    /**
     * Handle Google callback with authorization code
     */
    @GetMapping("/callback/google")
    public void googleCallback(@RequestParam(required = false) String code,
                               @RequestParam(required = false) String error,
                               HttpServletResponse response) throws IOException {

        if (error != null) {
            response.sendRedirect(frontendUrl + "/login?error=" + URLEncoder.encode(error, StandardCharsets.UTF_8));
            return;
        }

        if (code == null || code.isBlank()) {
            response.sendRedirect(frontendUrl + "/login?error=missing_code");
            return;
        }

        // Step 1: Exchange authorization code for tokens
        String tokenEndpoint = "https://oauth2.googleapis.com/token";
        String tokenRequestBody = "code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                + "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8)
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&grant_type=authorization_code";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<String> tokenRequest = new HttpEntity<>(tokenRequestBody, headers);

        ResponseEntity<String> tokenResponse;
        try {
            tokenResponse = restTemplate.postForEntity(tokenEndpoint, tokenRequest, String.class);
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=token_exchange_failed");
            return;
        }

        if (!tokenResponse.getStatusCode().is2xxSuccessful() || tokenResponse.getBody() == null) {
            response.sendRedirect(frontendUrl + "/login?error=token_exchange_failed");
            return;
        }

        JsonNode tokenJson = objectMapper.readTree(tokenResponse.getBody());
        String accessToken = tokenJson.path("access_token").asText(null);

        if (accessToken == null) {
            response.sendRedirect(frontendUrl + "/login?error=no_access_token");
            return;
        }

        // Step 2: Get user info from Google
        HttpHeaders userInfoHeaders = new HttpHeaders();
        userInfoHeaders.setBearerAuth(accessToken);
        HttpEntity<Void> userInfoRequest = new HttpEntity<>(userInfoHeaders);

        ResponseEntity<String> userInfoResponse;
        try {
            userInfoResponse = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    userInfoRequest,
                    String.class
            );
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=userinfo_failed");
            return;
        }

        if (!userInfoResponse.getStatusCode().is2xxSuccessful() || userInfoResponse.getBody() == null) {
            response.sendRedirect(frontendUrl + "/login?error=userinfo_failed");
            return;
        }

        JsonNode userInfo = objectMapper.readTree(userInfoResponse.getBody());
        String email = userInfo.path("email").asText();
        String name = userInfo.path("name").asText(email);
        String sub = userInfo.path("sub").asText();

        if (email == null || email.isBlank()) {
            response.sendRedirect(frontendUrl + "/login?error=no_email");
            return;
        }

        // Step 3: Process login (find/create user, generate JWT)
        try {
            AuthResponse authResponse = oAuth2Service.processGoogleLogin(email, name, sub);

            // Step 4: Redirect to frontend with tokens
            String callbackUrl = frontendUrl + "/auth/callback"
                    + "?token=" + URLEncoder.encode(authResponse.accessToken(), StandardCharsets.UTF_8)
                    + "&refreshToken=" + URLEncoder.encode(authResponse.refreshToken(), StandardCharsets.UTF_8);

            response.sendRedirect(callbackUrl);
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/login?error=server_error");
        }
    }
}
