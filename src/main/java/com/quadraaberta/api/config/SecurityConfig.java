package com.quadraaberta.api.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quadraaberta.api.security.SecurityFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final SecurityFilter securityFilter;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${quadraaberta.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Endpoints públicos de autenticação, documentação e uploads locais
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        
                        // Leitura pública de quadras, partidas abertas, turmas e chamados
                        .requestMatchers(HttpMethod.GET, "/api/quadras/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/partidas/minhas").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/partidas", "/api/partidas/{id}", "/api/partidas/{partidaId}/mensagens").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/turmas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chamados/**").permitAll()
                        
                        // Gestão de quadras e status de chamados exclusiva para GESTOR
                        .requestMatchers(HttpMethod.POST, "/api/quadras/**").hasAuthority("ROLE_GESTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/quadras/**").hasAuthority("ROLE_GESTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/quadras/**").hasAuthority("ROLE_GESTOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/chamados/{id}/status").hasAuthority("ROLE_GESTOR")

                        // Criação de turmas sociais exclusiva para VOLUNTARIO ou GESTOR
                        .requestMatchers(HttpMethod.POST, "/api/turmas/**").hasAnyAuthority("ROLE_VOLUNTARIO", "ROLE_GESTOR")

                        // Qualquer outra rota requer autenticação
                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                            boolean expirado = Boolean.TRUE.equals(request.getAttribute("jwt_expired"));
                            if (expirado) {
                                response.setHeader("X-Token-Expired", "true");
                            }
                            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                                    HttpStatus.UNAUTHORIZED,
                                    expirado 
                                            ? "Sua sessão expirou. Por favor, realize o login novamente."
                                            : "Acesso não autorizado. Token JWT ausente ou inválido."
                            );
                            problem.setTitle(expirado ? "Sessão Expirada" : "Não Autorizado");
                            problem.setType(URI.create(expirado ? "https://quadraaberta.com.br/erros/sessao-expirada" : "https://quadraaberta.com.br/erros/nao-autorizado"));
                            response.getOutputStream().write(objectMapper.writeValueAsBytes(problem));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                            ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                                    HttpStatus.FORBIDDEN,
                                    "Você não possui permissão para acessar este recurso."
                            );
                            problem.setTitle("Acesso Proibido");
                            problem.setType(URI.create("https://quadraaberta.com.br/erros/acesso-proibido"));
                            response.getOutputStream().write(objectMapper.writeValueAsBytes(problem));
                        })
                )
                .addFilterBefore(securityFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public org.springframework.security.core.userdetails.UserDetailsService userDetailsService(com.quadraaberta.api.repository.UsuarioRepository usuarioRepository) {
        return email -> usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("Usuário não encontrado com e-mail: " + email));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(s -> s.trim())
                .filter(s -> !s.isEmpty())
                .toList();

        List<String> patterns = new java.util.ArrayList<>(origins);
        patterns.add("http://localhost:*");
        patterns.add("http://127.0.0.1:*");
        patterns.add("http://[::1]:*");
        patterns.add("https://*.vercel.app");
        patterns.add("http://*.vercel.app");

        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "*"));
        configuration.setExposedHeaders(List.of("Authorization", "X-Token-Expired"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
