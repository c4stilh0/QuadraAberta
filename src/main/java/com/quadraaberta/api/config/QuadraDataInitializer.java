package com.quadraaberta.api.config;

import com.quadraaberta.api.repository.QuadraRepository;
import com.quadraaberta.api.service.QuadraIngestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuadraDataInitializer implements ApplicationRunner {

    private final QuadraRepository quadraRepository;
    private final QuadraIngestionService quadraIngestionService;

    @Override
    public void run(ApplicationArguments args) {
        long total = quadraRepository.count();
        if (total == 0) {
            log.info("Nenhuma quadra cadastrada no banco. Disparando ingestão automática de espaços esportivos de Sete Lagoas...");
            quadraIngestionService.sincronizarQuadrasSeteLagoas();
        } else {
            log.info("Banco de dados já contém {} quadras/espaços esportivos cadastrados.", total);
        }
    }
}
