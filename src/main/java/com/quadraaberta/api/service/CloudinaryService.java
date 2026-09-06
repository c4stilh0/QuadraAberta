package com.quadraaberta.api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.quadraaberta.api.exception.ValidacaoNegocioException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

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

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    arquivo.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "quadraaberta/" + pasta,
                            "resource_type", "image"
                    )
            );
            return (String) uploadResult.get("secure_url");
        } catch (IOException e) {
            log.error("Erro ao enviar foto para o Cloudinary", e);
            throw new ValidacaoNegocioException("Falha no envio da imagem para o armazenamento em nuvem.");
        }
    }
}
