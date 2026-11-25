package com.quadraaberta.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:demo-quadraaberta}")
    private String cloudName;

    @Value("${cloudinary.api-key:demo-key}")
    private String apiKey;

    @Value("${quadraaberta.backend-url:http://localhost:8080}")
    private String backendUrl;

    private static final List<String> TIPOS_PERMITIDOS = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    public String uploadFoto(MultipartFile arquivo, String pasta) {
        if (arquivo == null || arquivo.isEmpty()) {
            return null;
        }

        String contentType = arquivo.getContentType();
        if (contentType == null || !TIPOS_PERMITIDOS.contains(contentType.toLowerCase())) {
            throw new ValidacaoNegocioException("Formato de imagem inválido. Use JPEG, PNG ou WEBP.");
        }

        // Se o usuário configurou credenciais reais do Cloudinary, faz o upload para nuvem
        boolean isCloudinaryConfigurado = cloudName != null && !cloudName.isBlank() && !cloudName.contains("demo")
                && apiKey != null && !apiKey.isBlank() && !apiKey.contains("demo");

        if (isCloudinaryConfigurado) {
            try {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(
                        arquivo.getBytes(),
                        ObjectUtils.asMap(
                                "folder", "quadraaberta/" + pasta,
                                "resource_type", "image"
                        )
                );
                String secureUrl = (String) uploadResult.get("secure_url");
                log.info("Foto enviada com sucesso ao Cloudinary: {}", secureUrl);
                return secureUrl;
            } catch (Exception e) {
                log.warn("Erro ao enviar foto para o Cloudinary ({}). Utilizando armazenamento local como fallback...", e.getMessage());
            }
        } else {
            log.info("Cloudinary em modo demonstração ('{}'). Salvando imagem no armazenamento local (uploads/{})...", cloudName, pasta);
        }

        // Fallback local elegante: salva no disco local e serve publicamente via /uploads/**
        return salvarLocalmente(arquivo, pasta);
    }

    private String salvarLocalmente(MultipartFile arquivo, String pasta) {
        try {
            Path diretorio = Paths.get("uploads", pasta);
            if (!Files.exists(diretorio)) {
                Files.createDirectories(diretorio);
            }

            String extensao = ".jpg";
            String originalNome = arquivo.getOriginalFilename();
            if (originalNome != null && originalNome.contains(".")) {
                extensao = originalNome.substring(originalNome.lastIndexOf("."));
            }

            String nomeArquivo = UUID.randomUUID() + extensao;
            Path caminhoArquivo = diretorio.resolve(nomeArquivo);
            Files.copy(arquivo.getInputStream(), caminhoArquivo, StandardCopyOption.REPLACE_EXISTING);

            log.info("Imagem salva localmente com sucesso em: {}", caminhoArquivo.toAbsolutePath());
            String base = backendUrl != null ? backendUrl.replaceAll("/+$", "") : "";
            return base + "/uploads/" + pasta + "/" + nomeArquivo;
        } catch (IOException e) {
            log.error("Erro ao salvar imagem localmente", e);
            throw new ValidacaoNegocioException("Falha ao salvar a imagem no armazenamento.");
        }
    }
}
