package com.quadraaberta.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quadraaberta.api.entity.Quadra;
import com.quadraaberta.api.entity.enums.StatusQuadra;
import com.quadraaberta.api.entity.enums.TipoPiso;
import com.quadraaberta.api.repository.QuadraRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuadraIngestionService {

    private final QuadraRepository quadraRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Coordenadas centrais de bairros populares de Sete Lagoas para mapeamento espacial
    private static final Map<String, double[]> BAIRROS_SETELAGOAS = new LinkedHashMap<>();
    static {
        BAIRROS_SETELAGOAS.put("Belo Vale", new double[]{-19.4380, -44.2250});
        BAIRROS_SETELAGOAS.put("Progresso", new double[]{-19.4520, -44.2380});
        BAIRROS_SETELAGOAS.put("Montreal", new double[]{-19.4750, -44.2650});
        BAIRROS_SETELAGOAS.put("Boa Vista", new double[]{-19.4625, -44.2540});
        BAIRROS_SETELAGOAS.put("Cidade de Deus", new double[]{-19.4290, -44.2180});
        BAIRROS_SETELAGOAS.put("Verde Vale", new double[]{-19.4450, -44.2150});
        BAIRROS_SETELAGOAS.put("Itapuã", new double[]{-19.4610, -44.2580});
        BAIRROS_SETELAGOAS.put("Esperança", new double[]{-19.4420, -44.2350});
        BAIRROS_SETELAGOAS.put("São João", new double[]{-19.4730, -44.2390});
        BAIRROS_SETELAGOAS.put("Interlagos", new double[]{-19.4570, -44.2260});
        BAIRROS_SETELAGOAS.put("Santa Luzia", new double[]{-19.4580, -44.2320});
        BAIRROS_SETELAGOAS.put("Canaã", new double[]{-19.4550, -44.2500});
        BAIRROS_SETELAGOAS.put("Centro", new double[]{-19.4650, -44.2460});
        BAIRROS_SETELAGOAS.put("Vapabuçu", new double[]{-19.4710, -44.2520});
        BAIRROS_SETELAGOAS.put("Carmo", new double[]{-19.4680, -44.2400});
    }

    /**
     * Ingestão e sincronização de todos os espaços esportivos públicos de Sete Lagoas.
     */
    @Transactional
    public Map<String, Object> sincronizarQuadrasSeteLagoas() {
        log.info("Iniciando sincronização automática de quadras e espaços esportivos de Sete Lagoas...");
        List<QuadraImportItem> itens = buscarEspacosOpenStreetMap();

        if (itens.isEmpty()) {
            log.warn("Nenhum dado retornado da API Overpass. Usando catálogo integrado de Sete Lagoas.");
            itens = obterCatalogoPadraoSeteLagoas();
        }

        int novas = 0;
        int atualizadas = 0;

        for (QuadraImportItem item : itens) {
            Optional<Quadra> existente = quadraRepository.findByNome(item.nome);
            if (existente.isPresent()) {
                Quadra q = existente.get();
                q.setBairro(item.bairro);
                q.setLogradouro(item.logradouro);
                q.setLatitude(item.latitude);
                q.setLongitude(item.longitude);
                q.setTipoPiso(item.tipoPiso);
                q.setPossuiIluminacao(item.possuiIluminacao);
                q.setModalidades(item.modalidades);
                quadraRepository.save(q);
                atualizadas++;
            } else {
                Quadra nova = Quadra.builder()
                        .nome(item.nome)
                        .bairro(item.bairro)
                        .logradouro(item.logradouro)
                        .cep(item.cep)
                        .tipoPiso(item.tipoPiso)
                        .possuiIluminacao(item.possuiIluminacao)
                        .latitude(item.latitude)
                        .longitude(item.longitude)
                        .modalidades(item.modalidades)
                        .status(StatusQuadra.DISPONIVEL)
                        .build();
                quadraRepository.save(nova);
                novas++;
            }
        }

        log.info("Sincronização concluída: {} novas quadras criadas, {} atualizadas. Total no banco: {}",
                novas, atualizadas, quadraRepository.count());

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("totalProcessadas", itens.size());
        resultado.put("novasInseridas", novas);
        resultado.put("atualizadas", atualizadas);
        resultado.put("totalNoBanco", quadraRepository.count());
        resultado.put("mensagem", "Espaços esportivos de Sete Lagoas sincronizados com sucesso!");
        return resultado;
    }

    /**
     * Consulta a API Overpass do OpenStreetMap com a Bounding Box de Sete Lagoas.
     */
    private List<QuadraImportItem> buscarEspacosOpenStreetMap() {
        String query = "[out:json][timeout:25];" +
                "(" +
                "node[\"leisure\"=\"pitch\"](-19.56,-44.38,-19.36,-44.14);" +
                "way[\"leisure\"=\"pitch\"](-19.56,-44.38,-19.36,-44.14);" +
                "node[\"leisure\"=\"sports_centre\"](-19.56,-44.38,-19.36,-44.14);" +
                "way[\"leisure\"=\"sports_centre\"](-19.56,-44.38,-19.36,-44.14);" +
                "node[\"leisure\"=\"track\"](-19.56,-44.38,-19.36,-44.14);" +
                "way[\"leisure\"=\"track\"](-19.56,-44.38,-19.36,-44.14);" +
                ");" +
                "out center tags;";

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            String requestBody = "data=" + URLEncoder.encode(query, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://overpass-api.de/api/interpreter"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("User-Agent", "QuadraAberta/1.0 (https://github.com/c4stilh0/QuadraAberta)")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return parsearElementosOsm(response.body());
            } else {
                log.warn("Overpass API retornou status {}", response.statusCode());
            }
        } catch (Exception e) {
            log.warn("Falha ao consultar Overpass API online: {}. Recorrendo ao catálogo local.", e.getMessage());
        }

        return Collections.emptyList();
    }

    /**
     * Converte o JSON do OpenStreetMap em itens de quadra com normalização de bairros e nomes.
     */
    private List<QuadraImportItem> parsearElementosOsm(String json) {
        List<QuadraImportItem> lista = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode elements = root.path("elements");
            int semNomeIndex = 1;

            for (JsonNode el : elements) {
                double lat;
                double lon;

                if (el.has("lat") && el.has("lon")) {
                    lat = el.get("lat").asDouble();
                    lon = el.get("lon").asDouble();
                } else if (el.has("center")) {
                    lat = el.get("center").get("lat").asDouble();
                    lon = el.get("center").get("lon").asDouble();
                } else {
                    continue;
                }

                JsonNode tags = el.path("tags");
                String name = tags.has("name") ? tags.get("name").asText().trim() : null;
                String sport = tags.has("sport") ? tags.get("sport").asText().toLowerCase() : "";
                String leisure = tags.has("leisure") ? tags.get("leisure").asText().toLowerCase() : "";
                String surface = tags.has("surface") ? tags.get("surface").asText().toLowerCase() : "";
                String lit = tags.has("lit") ? tags.get("lit").asText().toLowerCase() : "";

                String bairro = determinarBairroMaisProximo(lat, lon);
                String modalidades = mapearModalidades(sport, leisure);
                TipoPiso piso = mapearTipoPiso(surface, sport);
                boolean ilum = "yes".equalsIgnoreCase(lit) || "true".equalsIgnoreCase(lit);

                if (name == null || name.isBlank()) {
                    name = gerarNomeAmigavel(sport, leisure, bairro, semNomeIndex++);
                }

                String logradouro = tags.has("addr:street")
                        ? tags.get("addr:street").asText()
                        : "Região Comunitária de Sete Lagoas";

                lista.add(new QuadraImportItem(
                        name,
                        bairro,
                        logradouro,
                        "35700-000",
                        piso,
                        ilum,
                        BigDecimal.valueOf(lat).setScale(7, RoundingMode.HALF_UP),
                        BigDecimal.valueOf(lon).setScale(7, RoundingMode.HALF_UP),
                        modalidades
                ));
            }
        } catch (Exception e) {
            log.error("Erro ao analisar resposta OSM: {}", e.getMessage());
        }
        return lista;
    }

    private String determinarBairroMaisProximo(double lat, double lon) {
        String bairroMaisProximo = "Centro";
        double menorDistancia = Double.MAX_VALUE;

        for (Map.Entry<String, double[]> entry : BAIRROS_SETELAGOAS.entrySet()) {
            double bLat = entry.getValue()[0];
            double bLon = entry.getValue()[1];
            double dist = Math.pow(lat - bLat, 2) + Math.pow(lon - bLon, 2);
            if (dist < menorDistancia) {
                menorDistancia = dist;
                bairroMaisProximo = entry.getKey();
            }
        }
        return bairroMaisProximo;
    }

    private String mapearModalidades(String sport, String leisure) {
        if ("skateboard".equalsIgnoreCase(sport)) return "SKATE";
        if (sport.contains("beach") || sport.contains("futevolei") || sport.contains("sand")) {
            return "BEACH TENNIS, FUTEVÔLEI, VÔLEI DE AREIA";
        }
        if ("basketball".equalsIgnoreCase(sport)) return "BASQUETE, MODALIDADES DE QUADRA";
        if ("tennis".equalsIgnoreCase(sport)) return "TÊNIS";
        if ("futsal".equalsIgnoreCase(sport)) return "FUTSAL, HANDEBOL";
        if ("athletics".equalsIgnoreCase(sport) || "track".equalsIgnoreCase(leisure)) {
            return "ATLETISMO, CAMINHADA";
        }
        if ("soccer".equalsIgnoreCase(sport)) return "FUTEBOL DE CAMPO / SOCIETY";
        return "FUTSAL, BASQUETE, VÔLEI";
    }

    private TipoPiso mapearTipoPiso(String surface, String sport) {
        if (surface.contains("sand") || sport.contains("beach")) return TipoPiso.AREIA;
        if (surface.contains("concrete") || surface.contains("cement")) return TipoPiso.CIMENTO;
        if (surface.contains("asphalt")) return TipoPiso.ASFALTO;
        if (surface.contains("synthetic") || surface.contains("artificial")) return TipoPiso.SINTETICO;
        if (surface.contains("wood")) return TipoPiso.MADEIRA;
        return TipoPiso.CIMENTO;
    }

    private String gerarNomeAmigavel(String sport, String leisure, String bairro, int indice) {
        if ("skateboard".equalsIgnoreCase(sport)) {
            return "Pista de Skate Pública — " + bairro;
        }
        if (sport.contains("beach") || sport.contains("futevolei")) {
            return "Quadra de Areia Comunitária — " + bairro;
        }
        if ("athletics".equalsIgnoreCase(sport) || "track".equalsIgnoreCase(leisure)) {
            return "Pista de Atletismo e Caminhada — " + bairro;
        }
        if ("soccer".equalsIgnoreCase(sport)) {
            return "Campo de Futebol Comunitário #" + indice + " — " + bairro;
        }
        if ("basketball".equalsIgnoreCase(sport)) {
            return "Quadra de Basquete Comunitária — " + bairro;
        }
        return "Quadra Poliesportiva #" + indice + " — " + bairro;
    }

    /**
     * Catálogo padronizado e georreferenciado dos principais espaços esportivos municipais de Sete Lagoas.
     */
    public List<QuadraImportItem> obterCatalogoPadraoSeteLagoas() {
        List<QuadraImportItem> catalogo = new ArrayList<>();

        catalogo.add(new QuadraImportItem("Ginásio Coberto Vinício Dias Avelar", "Belo Vale", "Av. Circular, s/n", "35702-352", TipoPiso.CIMENTO, true, BigDecimal.valueOf(-19.4385000), BigDecimal.valueOf(-44.2255000), "FUTSAL, BASQUETE, VOLEIBOL"));
        catalogo.add(new QuadraImportItem("Complexo Esportivo do Bairro Progresso (CSU)", "Progresso", "Rua Itambacuri, 180", "35700-456", TipoPiso.CIMENTO, true, BigDecimal.valueOf(-19.4522000), BigDecimal.valueOf(-44.2384000), "FUTSAL, HANDEBOL, BASQUETE"));
        catalogo.add(new QuadraImportItem("Centro Esportivo do Bairro Montreal", "Montreal", "Av. das Nações, 450", "35701-200", TipoPiso.CIMENTO, true, BigDecimal.valueOf(-19.4751000), BigDecimal.valueOf(-44.2652000), "FUTSAL, VOLEIBOL, BASQUETE"));
        catalogo.add(new QuadraImportItem("Quadra e Pista de Skate da Lagoa Boa Vista", "Boa Vista", "Av. Professor Maurílio de Jesus Peixoto", "35700-012", TipoPiso.ASFALTO, true, BigDecimal.valueOf(-19.4628000), BigDecimal.valueOf(-44.2545000), "SKATE, PATINS, BASQUETE STREET"));
        catalogo.add(new QuadraImportItem("Arena MVP Areia e Lazer", "Canaã", "Rua Santa Juliana, 1200", "35701-010", TipoPiso.AREIA, true, BigDecimal.valueOf(-19.4512512), BigDecimal.valueOf(-44.2448345), "BEACH TENNIS, FUTEVÔLEI, VÔLEI DE AREIA"));
        catalogo.add(new QuadraImportItem("SESC Sete Lagoas — Espaço Poliesportivo", "Canaã", "Rua Dom Pedro II, 280", "35700-050", TipoPiso.SINTETICO, true, BigDecimal.valueOf(-19.4512933), BigDecimal.valueOf(-44.2455551), "FUTSAL, BASQUETE, NATAÇÃO"));
        catalogo.add(new QuadraImportItem("Campo do Bangu Esporte Clube", "São João", "Rua José Duarte de Paiva, 890", "35700-060", TipoPiso.OUTRO, false, BigDecimal.valueOf(-19.4721000), BigDecimal.valueOf(-44.2395000), "FUTEBOL DE CAMPO"));
        catalogo.add(new QuadraImportItem("Campo Ajax Comunitário", "Interlagos", "Av. Padre Tarcísio Gonçalves, 500", "35701-500", TipoPiso.OUTRO, false, BigDecimal.valueOf(-19.4568000), BigDecimal.valueOf(-44.2265000), "FUTEBOL DE CAMPO"));
        catalogo.add(new QuadraImportItem("Campo do Sertanejo Futebol Clube", "Verde Vale", "Rua das Rosas, s/n", "35702-010", TipoPiso.OUTRO, false, BigDecimal.valueOf(-19.4452000), BigDecimal.valueOf(-44.2154000), "FUTEBOL DE CAMPO"));
        catalogo.add(new QuadraImportItem("Quadra Poliesportiva do Bairro Itapuã", "Itapuã", "Rua Diamantina, 320", "35701-120", TipoPiso.CIMENTO, true, BigDecimal.valueOf(-19.4612000), BigDecimal.valueOf(-44.2582000), "FUTSAL, BASQUETE"));
        catalogo.add(new QuadraImportItem("Quadra Comunitária Bairro Cidade de Deus", "Cidade de Deus", "Rua Três, 150", "35702-780", TipoPiso.CIMENTO, false, BigDecimal.valueOf(-19.4292000), BigDecimal.valueOf(-44.2185000), "FUTSAL, VOLEIBOL"));
        catalogo.add(new QuadraImportItem("Quadra Poliesportiva Esperança", "Esperança", "Av. Circular, s/n", "35702-310", TipoPiso.CIMENTO, true, BigDecimal.valueOf(-19.4421000), BigDecimal.valueOf(-44.2352000), "FUTSAL, BASQUETE, VOLEIBOL"));
        catalogo.add(new QuadraImportItem("Parque Náutico da Lagoa Boa Vista — Quadra Poliesportiva", "Boa Vista", "Av. Maurílio de Jesus Peixoto, s/n", "35700-012", TipoPiso.CIMENTO, true, BigDecimal.valueOf(-19.4619000), BigDecimal.valueOf(-44.2538000), "FUTSAL, BASQUETE"));
        catalogo.add(new QuadraImportItem("Quadra Poliesportiva Santa Luzia", "Santa Luzia", "Rua Goiás, 410", "35700-340", TipoPiso.CIMENTO, true, BigDecimal.valueOf(-19.4582000), BigDecimal.valueOf(-44.2325000), "FUTSAL, VOLEIBOL"));
        catalogo.add(new QuadraImportItem("Huracan Atlético Clube — Quadra e Campo", "Carmo", "Rua Princesa Isabel, 210", "35700-140", TipoPiso.CIMENTO, false, BigDecimal.valueOf(-19.4674461), BigDecimal.valueOf(-44.2535697), "FUTSAL, FUTEBOL"));

        return catalogo;
    }

    public record QuadraImportItem(
            String nome,
            String bairro,
            String logradouro,
            String cep,
            TipoPiso tipoPiso,
            Boolean possuiIluminacao,
            BigDecimal latitude,
            BigDecimal longitude,
            String modalidades
    ) {}
}
