package com.quadraaberta.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quadraaberta.api.dto.CadastroUsuarioRequestDTO;
import com.quadraaberta.api.dto.LoginRequestDTO;
import com.quadraaberta.api.entity.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("Integração: Deve cadastrar morador e realizar login recebendo token JWT")
    void deveCadastrarELogarComSucesso() throws Exception {
        CadastroUsuarioRequestDTO cadastroDTO = new CadastroUsuarioRequestDTO(
                "Maria da Silva",
                "maria.silva@comunidade.com",
                "31988887777",
                "11144477735",
                "senhaForte123",
                Role.ROLE_COMUNIDADE
        );

        // 1. Cadastro
        mockMvc.perform(post("/api/auth/cadastrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cadastroDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("maria.silva@comunidade.com"))
                .andExpect(jsonPath("$.role").value("ROLE_COMUNIDADE"));

        // 2. Login
        LoginRequestDTO loginDTO = new LoginRequestDTO(
                "maria.silva@comunidade.com",
                "senhaForte123"
        );

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.email").value("maria.silva@comunidade.com"));
    }
}
