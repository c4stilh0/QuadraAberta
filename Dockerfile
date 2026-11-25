# ==============================================================================
# ETAPA 1: BUILD DA APLICAÇÃO (MULTI-STAGE BUILD)
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Otimização de cache de dependências
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copia código-fonte e compila gerando o JAR sem rodar testes
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# ETAPA 2: IMAGEM DE EXECUÇÃO ULTRA-LEVE (FREE TIER: RENDER / KOYEB)
# ==============================================================================
FROM eclipse-temurin:17-jre-alpine

# Criação de usuário não-root e diretório de uploads para máxima segurança
WORKDIR /app
RUN addgroup -S quadra && adduser -S quadra -G quadra \
    && mkdir -p /app/uploads \
    && chown -R quadra:quadra /app
USER quadra:quadra

# Copia apenas o artefato final compilado
COPY --from=builder /build/target/quadra-aberta-api-0.0.1-SNAPSHOT.jar app.jar

# Configuração de portas padrão
EXPOSE 8080

# Flags JVM customizadas para ambientes Free Tier com teto de 512MB RAM:
# -Xms128m: Alocação inicial econômica
# -Xmx384m: Limite máximo estrito para evitar OOM Killer no Render/Koyeb
# -XX:+UseG1GC e economia de memória de strings
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseG1GC -XX:+UseStringDeduplication -Dfile.encoding=UTF-8"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
