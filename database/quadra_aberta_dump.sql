--
-- PostgreSQL database dump
--

\restrict ocK0aKrQTdTNyHy4RthCZyMzJcAjoO1HjdQ6szFYcO2reqKjsyF2J9WzxSNkhkc

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: tb_avaliacao_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_avaliacao_usuario (
    id bigint NOT NULL,
    avaliador_id bigint NOT NULL,
    avaliado_id bigint NOT NULL,
    partida_id bigint NOT NULL,
    nota_reputacao integer NOT NULL,
    nivel_habilidade character varying(30),
    comentario character varying(255),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_avaliacao_nao_autoavaliar CHECK ((avaliador_id <> avaliado_id)),
    CONSTRAINT tb_avaliacao_usuario_nota_reputacao_check CHECK (((nota_reputacao >= 1) AND (nota_reputacao <= 5)))
);


--
-- Name: tb_avaliacao_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_avaliacao_usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_avaliacao_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_avaliacao_usuario_id_seq OWNED BY public.tb_avaliacao_usuario.id;


--
-- Name: tb_chamado_zeladoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_chamado_zeladoria (
    id bigint NOT NULL,
    quadra_id bigint NOT NULL,
    autor_id bigint NOT NULL,
    categoria character varying(50) NOT NULL,
    descricao text NOT NULL,
    foto_url character varying(500),
    status character varying(30) NOT NULL,
    data_abertura timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_resolucao timestamp without time zone
);


--
-- Name: tb_chamado_zeladoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_chamado_zeladoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_chamado_zeladoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_chamado_zeladoria_id_seq OWNED BY public.tb_chamado_zeladoria.id;


--
-- Name: tb_mensagem_partida; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_mensagem_partida (
    id bigint NOT NULL,
    partida_id bigint NOT NULL,
    usuario_id bigint,
    conteudo character varying(500) NOT NULL,
    tipo character varying(20) DEFAULT 'USUARIO'::character varying NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tb_mensagem_partida_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_mensagem_partida_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_mensagem_partida_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_mensagem_partida_id_seq OWNED BY public.tb_mensagem_partida.id;


--
-- Name: tb_partida_match; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partida_match (
    id bigint NOT NULL,
    criador_id bigint NOT NULL,
    esporte character varying(50) NOT NULL,
    data_hora timestamp without time zone NOT NULL,
    duracao_minutos integer DEFAULT 60 NOT NULL,
    min_jogadores integer DEFAULT 10 NOT NULL,
    max_jogadores integer DEFAULT 14 NOT NULL,
    descricao text,
    bairro_criador character varying(100) NOT NULL,
    status character varying(30) DEFAULT 'BUSCANDO_JOGADORES'::character varying NOT NULL,
    quadra_escolhida_id bigint,
    centroide_lat double precision,
    centroide_lng double precision,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tb_partida_match_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_partida_match_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_partida_match_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_partida_match_id_seq OWNED BY public.tb_partida_match.id;


--
-- Name: tb_partida_participante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_partida_participante (
    id bigint NOT NULL,
    partida_id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    bairro character varying(100) NOT NULL,
    confirmado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tb_partida_participante_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_partida_participante_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_partida_participante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_partida_participante_id_seq OWNED BY public.tb_partida_participante.id;


--
-- Name: tb_quadra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_quadra (
    id bigint NOT NULL,
    nome character varying(100) NOT NULL,
    bairro character varying(80) NOT NULL,
    logradouro character varying(150) NOT NULL,
    cep character varying(10),
    tipo_piso character varying(50) NOT NULL,
    possui_iluminacao boolean DEFAULT false NOT NULL,
    status character varying(30) NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    modalidades character varying(250)
);


--
-- Name: tb_quadra_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_quadra_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_quadra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_quadra_id_seq OWNED BY public.tb_quadra.id;


--
-- Name: tb_reserva; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_reserva (
    id bigint NOT NULL,
    quadra_id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    data_inicio timestamp without time zone NOT NULL,
    data_fim timestamp without time zone NOT NULL,
    tipo_reserva character varying(30) NOT NULL,
    status character varying(30) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_reserva_datas CHECK ((data_fim > data_inicio))
);


--
-- Name: tb_reserva_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_reserva_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_reserva_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_reserva_id_seq OWNED BY public.tb_reserva.id;


--
-- Name: tb_turma_social; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_turma_social (
    id bigint NOT NULL,
    quadra_id bigint NOT NULL,
    instrutor_id bigint NOT NULL,
    modalidade character varying(60) NOT NULL,
    dia_semana character varying(20) NOT NULL,
    horario_inicio time without time zone NOT NULL,
    horario_fim time without time zone NOT NULL,
    capacidade_alunos integer NOT NULL,
    ativo boolean DEFAULT true NOT NULL
);


--
-- Name: tb_turma_social_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_turma_social_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_turma_social_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_turma_social_id_seq OWNED BY public.tb_turma_social.id;


--
-- Name: tb_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tb_usuario (
    id bigint NOT NULL,
    nome character varying(120) NOT NULL,
    email character varying(120) NOT NULL,
    telefone character varying(20),
    cpf character varying(14) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    role character varying(30) NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    foto_url character varying(255),
    objetivo character varying(50) DEFAULT 'PRATICAR_ESPORTES'::character varying,
    reputacao double precision DEFAULT 5.00 NOT NULL,
    total_avaliacoes_reputacao integer DEFAULT 0 NOT NULL,
    habilidade_declarada character varying(30) DEFAULT 'JOGADOR_CASUAL'::character varying NOT NULL,
    habilidade_validada double precision,
    total_avaliacoes_habilidade integer DEFAULT 0 NOT NULL,
    streak_positiva integer DEFAULT 0 NOT NULL,
    streak_negativa integer DEFAULT 0 NOT NULL
);


--
-- Name: tb_usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tb_usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tb_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tb_usuario_id_seq OWNED BY public.tb_usuario.id;


--
-- Name: tb_avaliacao_usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacao_usuario ALTER COLUMN id SET DEFAULT nextval('public.tb_avaliacao_usuario_id_seq'::regclass);


--
-- Name: tb_chamado_zeladoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_chamado_zeladoria ALTER COLUMN id SET DEFAULT nextval('public.tb_chamado_zeladoria_id_seq'::regclass);


--
-- Name: tb_mensagem_partida id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagem_partida ALTER COLUMN id SET DEFAULT nextval('public.tb_mensagem_partida_id_seq'::regclass);


--
-- Name: tb_partida_match id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_match ALTER COLUMN id SET DEFAULT nextval('public.tb_partida_match_id_seq'::regclass);


--
-- Name: tb_partida_participante id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_participante ALTER COLUMN id SET DEFAULT nextval('public.tb_partida_participante_id_seq'::regclass);


--
-- Name: tb_quadra id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_quadra ALTER COLUMN id SET DEFAULT nextval('public.tb_quadra_id_seq'::regclass);


--
-- Name: tb_reserva id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reserva ALTER COLUMN id SET DEFAULT nextval('public.tb_reserva_id_seq'::regclass);


--
-- Name: tb_turma_social id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_turma_social ALTER COLUMN id SET DEFAULT nextval('public.tb_turma_social_id_seq'::regclass);


--
-- Name: tb_usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_usuario ALTER COLUMN id SET DEFAULT nextval('public.tb_usuario_id_seq'::regclass);


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.flyway_schema_history VALUES (1, '1', 'criar tabelas iniciais', 'SQL', 'V1__criar_tabelas_iniciais.sql', -1872041547, 'postgres', '2026-09-06 14:27:47.639688', 109, true);
INSERT INTO public.flyway_schema_history VALUES (2, '2', 'adicionar coordenadas e modalidades quadra', 'SQL', 'V2__adicionar_coordenadas_e_modalidades_quadra.sql', 260903761, 'postgres', '2026-09-06 20:49:58.490883', 57, true);
INSERT INTO public.flyway_schema_history VALUES (3, '3', 'adicionar foto e objetivo usuario', 'SQL', 'V3__adicionar_foto_e_objetivo_usuario.sql', 519872308, 'postgres', '2026-09-11 09:22:59.351355', 43, true);
INSERT INTO public.flyway_schema_history VALUES (4, '4', 'criar sistema matchmaking partidas', 'SQL', 'V4__criar_sistema_matchmaking_partidas.sql', 22332459, 'postgres', '2026-09-11 15:00:41.295946', 191, true);
INSERT INTO public.flyway_schema_history VALUES (5, '5', 'criar sistema reputacao habilidade', 'SQL', 'V5__criar_sistema_reputacao_habilidade.sql', -1138463153, 'postgres', '2026-09-11 20:00:21.574453', 52, true);
INSERT INTO public.flyway_schema_history VALUES (6, '6', 'alterar colunas reputacao para double', 'SQL', 'V6__alterar_colunas_reputacao_para_double.sql', -613662781, 'postgres', '2026-09-11 20:08:37.470605', 6, true);
INSERT INTO public.flyway_schema_history VALUES (7, '7', 'criar chat partida', 'SQL', 'V7__criar_chat_partida.sql', -2134983194, 'postgres', '2026-09-21 11:40:09.774417', 53, true);


--
-- Data for Name: tb_avaliacao_usuario; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tb_avaliacao_usuario VALUES (1, 1, 2, 8, 5, 'JOGADOR_CASUAL', 'Excelente parceiro de equipe, muito pontual!', '2026-09-11 20:10:12.411276');
INSERT INTO public.tb_avaliacao_usuario VALUES (2, 1, 2, 9, 5, 'JOGADOR_AMADOR', 'Excelente jogador, ótimo fair play e pontualidade!', '2026-09-11 20:13:02.424104');


--
-- Data for Name: tb_chamado_zeladoria; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tb_mensagem_partida; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tb_mensagem_partida VALUES (1, 10, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-21 11:46:05.84088');
INSERT INTO public.tb_mensagem_partida VALUES (2, 10, NULL, 'Gestor Municipal confirmou presença!', 'SISTEMA', '2026-09-21 11:46:06.203212');
INSERT INTO public.tb_mensagem_partida VALUES (3, 11, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-21 11:47:21.292843');
INSERT INTO public.tb_mensagem_partida VALUES (4, 11, NULL, 'Gestor Municipal confirmou presença!', 'SISTEMA', '2026-09-21 11:47:21.655937');
INSERT INTO public.tb_mensagem_partida VALUES (5, 12, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-21 11:47:57.522459');
INSERT INTO public.tb_mensagem_partida VALUES (6, 12, 2, 'Fala galera! Levo a bola oficial de Society âš½', 'USUARIO', '2026-09-21 11:47:57.57968');
INSERT INTO public.tb_mensagem_partida VALUES (7, 12, NULL, 'Gestor Municipal confirmou presença!', 'SISTEMA', '2026-09-21 11:47:57.68415');
INSERT INTO public.tb_mensagem_partida VALUES (8, 12, 1, 'Show de bola VinÃ­cius! Eu levo os coletes amarelos e azuis ðŸŽ½', 'USUARIO', '2026-09-21 11:47:57.717224');
INSERT INTO public.tb_mensagem_partida VALUES (9, 4, 2, 'Teste', 'USUARIO', '2026-09-21 12:00:35.764195');
INSERT INTO public.tb_mensagem_partida VALUES (10, 4, 2, '⚽ Levo a bola!', 'USUARIO', '2026-09-21 12:00:37.447594');
INSERT INTO public.tb_mensagem_partida VALUES (11, 2, 1, '123', 'USUARIO', '2026-09-21 12:02:37.457268');
INSERT INTO public.tb_mensagem_partida VALUES (12, 4, 1, 'teste123', 'USUARIO', '2026-09-21 12:03:04.941503');
INSERT INTO public.tb_mensagem_partida VALUES (13, 4, 1, '🎽 Levo os coletes!', 'USUARIO', '2026-09-21 12:03:11.928028');
INSERT INTO public.tb_mensagem_partida VALUES (14, 4, 2, '⏱️ Chego 10min antes!', 'USUARIO', '2026-09-21 12:03:15.524424');
INSERT INTO public.tb_mensagem_partida VALUES (15, 4, 1, '🧤 Jogo no gol!', 'USUARIO', '2026-09-21 12:03:20.947848');
INSERT INTO public.tb_mensagem_partida VALUES (16, 4, NULL, 'Vinícius Castilho de Souza e Silva saiu da partida.', 'SISTEMA', '2026-09-21 12:05:51.377351');
INSERT INTO public.tb_mensagem_partida VALUES (17, 7, NULL, 'Vinícius Castilho de Souza e Silva saiu da partida.', 'SISTEMA', '2026-09-21 12:05:59.122099');
INSERT INTO public.tb_mensagem_partida VALUES (18, 8, NULL, 'Vinícius Castilho de Souza e Silva saiu da partida.', 'SISTEMA', '2026-09-21 12:06:05.419433');
INSERT INTO public.tb_mensagem_partida VALUES (19, 13, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-21 13:31:30.596034');
INSERT INTO public.tb_mensagem_partida VALUES (20, 13, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-21 13:31:30.729955');
INSERT INTO public.tb_mensagem_partida VALUES (21, 10, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-21 13:39:07.847652');
INSERT INTO public.tb_mensagem_partida VALUES (22, 8, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-21 14:31:54.930062');
INSERT INTO public.tb_mensagem_partida VALUES (23, 7, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-21 14:31:59.14213');
INSERT INTO public.tb_mensagem_partida VALUES (24, 14, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-23 14:28:53.134017');
INSERT INTO public.tb_mensagem_partida VALUES (25, 6, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-23 14:36:32.713279');
INSERT INTO public.tb_mensagem_partida VALUES (26, 15, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-29 19:53:55.460393');
INSERT INTO public.tb_mensagem_partida VALUES (27, 3, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-29 19:55:13.807339');
INSERT INTO public.tb_mensagem_partida VALUES (28, 4, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-29 19:55:18.939791');
INSERT INTO public.tb_mensagem_partida VALUES (29, 5, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-29 19:55:27.821576');
INSERT INTO public.tb_mensagem_partida VALUES (30, 14, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-29 19:55:36.171889');
INSERT INTO public.tb_mensagem_partida VALUES (31, 15, NULL, 'Gestor Municipal confirmou presença!', 'SISTEMA', '2026-09-29 19:55:52.704289');
INSERT INTO public.tb_mensagem_partida VALUES (32, 15, NULL, 'Gestor Municipal saiu da partida.', 'SISTEMA', '2026-09-29 19:56:28.265849');
INSERT INTO public.tb_mensagem_partida VALUES (33, 15, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-29 19:56:36.091994');
INSERT INTO public.tb_mensagem_partida VALUES (34, 16, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-29 19:57:05.126095');
INSERT INTO public.tb_mensagem_partida VALUES (35, 16, NULL, 'Gestor Municipal confirmou presença!', 'SISTEMA', '2026-09-29 19:57:23.154226');
INSERT INTO public.tb_mensagem_partida VALUES (36, 16, NULL, 'Partida cancelada pelo organizador.', 'SISTEMA', '2026-09-29 19:58:09.185547');
INSERT INTO public.tb_mensagem_partida VALUES (37, 17, NULL, 'Partida criada por Vinícius Castilho de Souza e Silva! Aguardando quórum.', 'SISTEMA', '2026-09-29 19:58:40.005464');
INSERT INTO public.tb_mensagem_partida VALUES (38, 17, NULL, 'Gestor Municipal confirmou presença!', 'SISTEMA', '2026-09-29 19:58:56.143891');
INSERT INTO public.tb_mensagem_partida VALUES (39, 17, 2, 'teste', 'USUARIO', '2026-09-29 20:00:08.543231');
INSERT INTO public.tb_mensagem_partida VALUES (40, 17, 1, 'teste2', 'USUARIO', '2026-09-29 20:00:16.690661');
INSERT INTO public.tb_mensagem_partida VALUES (41, 17, 2, '⚽ Levo a bola!', 'USUARIO', '2026-09-29 20:00:25.220087');


--
-- Data for Name: tb_partida_match; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tb_partida_match VALUES (5, 1, 'Basquete', '2026-09-12 19:15:08', 90, 6, 10, 'Racha 3x3 de Basquete da Galera', 'Centro', 'CANCELADA', 6, -19.462, -44.245, '2026-09-11 19:15:08.643683');
INSERT INTO public.tb_partida_match VALUES (14, 2, 'FUTSAL', '2026-09-24 22:00:00', 90, 10, 14, 'Partida de Futsal em Sete Lagoas', 'Progresso', 'CANCELADA', NULL, -19.452, -44.238, '2026-09-23 14:28:53.073355');
INSERT INTO public.tb_partida_match VALUES (15, 2, 'FUTSAL', '2026-09-30 22:00:00', 90, 10, 14, 'Pelada Comunitária de Futsal', 'Progresso', 'CANCELADA', NULL, -19.452, -44.238, '2026-09-29 19:53:55.412113');
INSERT INTO public.tb_partida_match VALUES (16, 2, 'FUTSAL', '2026-09-30 22:00:00', 120, 10, 14, 'Teste1: teste', 'Belo Vale', 'CANCELADA', NULL, -19.445, -44.2315, '2026-09-29 19:57:05.117933');
INSERT INTO public.tb_partida_match VALUES (17, 2, 'TENIS', '2026-09-30 22:00:00', 90, 2, 4, 'Teste Tenis', 'Belo Vale', 'BUSCANDO_JOGADORES', NULL, -19.445, -44.2315, '2026-09-29 19:58:39.996445');
INSERT INTO public.tb_partida_match VALUES (9, 2, 'Basquete', '2026-09-13 20:13:02', 60, 6, 10, 'Basquete 3x3 no Parque da Cascata', 'Centro', 'CANCELADA', NULL, -19.4625, -44.2465, '2026-09-11 20:13:02.350423');
INSERT INTO public.tb_partida_match VALUES (12, 2, 'Futebol Society', '2026-09-22 11:47:57', 90, 8, 14, 'Futebol de teste do Chat ComunitÃ¡rio', 'Progresso', 'CANCELADA', NULL, -19.4615, -44.244, '2026-09-21 11:47:57.51755');
INSERT INTO public.tb_partida_match VALUES (11, 2, 'Futebol Society', '2026-09-22 11:47:21', 90, 8, 14, 'Futebol de teste do Chat Comunitário', 'Progresso', 'CANCELADA', NULL, -19.4615, -44.244, '2026-09-21 11:47:21.241125');
INSERT INTO public.tb_partida_match VALUES (1, 1, 'Futsal', '2026-09-12 15:01:41', 60, 10, 14, 'Pelada casual de Futsal da galera', 'Progresso', 'CANCELADA', NULL, -19.452, -44.238, '2026-09-11 15:01:41.549969');
INSERT INTO public.tb_partida_match VALUES (2, 1, 'Basquete', '2026-09-12 19:12:47', 90, 6, 10, 'Racha 3x3 de Basquete da Galera', 'Centro', 'CANCELADA', 6, -19.462, -44.245, '2026-09-11 19:12:47.071761');
INSERT INTO public.tb_partida_match VALUES (13, 2, 'Futebol Society', '2026-09-23 13:31:00', 60, 8, 14, 'Partida Teste Cancelamento e Desaparecimento', 'Progresso', 'CANCELADA', NULL, -19.4658, -44.2467, '2026-09-21 13:31:30.536547');
INSERT INTO public.tb_partida_match VALUES (10, 2, 'Futebol Society', '2026-09-22 11:46:05', 90, 8, 14, 'Futebol de teste do Chat Comunitário', 'Progresso', 'CANCELADA', NULL, -19.4615, -44.244, '2026-09-21 11:46:05.786446');
INSERT INTO public.tb_partida_match VALUES (8, 1, 'Vôlei de Areia', '2026-09-12 20:10:12', 90, 4, 8, 'Vôlei de areia para testar reputação', 'Centro', 'CANCELADA', NULL, -19.46, -44.24, '2026-09-11 20:10:12.322438');
INSERT INTO public.tb_partida_match VALUES (7, 1, 'Vôlei de Areia', '2026-09-12 20:09:53', 90, 4, 8, 'Vôlei de areia para testar reputação', 'Centro', 'CANCELADA', NULL, -19.46, -44.24, '2026-09-11 20:09:53.539065');
INSERT INTO public.tb_partida_match VALUES (6, 2, 'FUTSAL', '2026-09-12 22:00:00', 120, 10, 14, 'Partida Teste 1', 'Progresso', 'CANCELADA', NULL, -19.47356485855958, -44.25813409655369, '2026-09-11 19:27:38.220383');
INSERT INTO public.tb_partida_match VALUES (3, 1, 'Basquete', '2026-09-12 19:13:18', 90, 6, 10, 'Racha 3x3 de Basquete da Galera', 'Centro', 'CANCELADA', 6, -19.462, -44.245, '2026-09-11 19:13:18.831515');
INSERT INTO public.tb_partida_match VALUES (4, 1, 'Basquete', '2026-09-12 19:14:32', 90, 6, 10, 'Racha 3x3 de Basquete da Galera', 'Centro', 'CANCELADA', 6, -19.462, -44.245, '2026-09-11 19:14:32.67904');


--
-- Data for Name: tb_partida_participante; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tb_partida_participante VALUES (1, 1, 1, -19.452, -44.238, 'Progresso', '2026-09-11 15:01:41.549969');
INSERT INTO public.tb_partida_participante VALUES (2, 2, 1, -19.462, -44.245, 'Centro', '2026-09-11 19:12:47.071761');
INSERT INTO public.tb_partida_participante VALUES (3, 3, 1, -19.462, -44.245, 'Centro', '2026-09-11 19:13:18.831515');
INSERT INTO public.tb_partida_participante VALUES (4, 4, 1, -19.462, -44.245, 'Centro', '2026-09-11 19:14:32.67904');
INSERT INTO public.tb_partida_participante VALUES (6, 5, 1, -19.462, -44.245, 'Centro', '2026-09-11 19:15:08.643683');
INSERT INTO public.tb_partida_participante VALUES (8, 6, 2, -19.47356485855958, -44.25813409655369, 'Progresso', '2026-09-11 19:27:38.220383');
INSERT INTO public.tb_partida_participante VALUES (9, 7, 1, -19.46, -44.24, 'Centro', '2026-09-11 20:09:53.539065');
INSERT INTO public.tb_partida_participante VALUES (11, 8, 1, -19.46, -44.24, 'Centro', '2026-09-11 20:10:12.322438');
INSERT INTO public.tb_partida_participante VALUES (13, 9, 2, -19.462, -44.246, 'Centro', '2026-09-11 20:13:02.350423');
INSERT INTO public.tb_partida_participante VALUES (14, 9, 1, -19.463, -44.247, 'Canaã', '2026-09-11 20:13:02.381187');
INSERT INTO public.tb_partida_participante VALUES (15, 10, 2, -19.465, -44.248, 'Progresso', '2026-09-21 11:46:05.786446');
INSERT INTO public.tb_partida_participante VALUES (16, 10, 1, -19.458, -44.24, 'Canaã', '2026-09-21 11:46:06.197699');
INSERT INTO public.tb_partida_participante VALUES (17, 11, 2, -19.465, -44.248, 'Progresso', '2026-09-21 11:47:21.241125');
INSERT INTO public.tb_partida_participante VALUES (18, 11, 1, -19.458, -44.24, 'Canaã', '2026-09-21 11:47:21.650127');
INSERT INTO public.tb_partida_participante VALUES (19, 12, 2, -19.465, -44.248, 'Progresso', '2026-09-21 11:47:57.51755');
INSERT INTO public.tb_partida_participante VALUES (20, 12, 1, -19.458, -44.24, 'CanaÃ£', '2026-09-21 11:47:57.681688');
INSERT INTO public.tb_partida_participante VALUES (21, 13, 2, -19.4658, -44.2467, 'Progresso', '2026-09-21 13:31:30.536547');
INSERT INTO public.tb_partida_participante VALUES (22, 14, 2, -19.452, -44.238, 'Progresso', '2026-09-23 14:28:53.073355');
INSERT INTO public.tb_partida_participante VALUES (23, 15, 2, -19.452, -44.238, 'Progresso', '2026-09-29 19:53:55.412113');
INSERT INTO public.tb_partida_participante VALUES (25, 16, 2, -19.438, -44.225, 'Belo Vale', '2026-09-29 19:57:05.117933');
INSERT INTO public.tb_partida_participante VALUES (26, 16, 1, -19.452, -44.238, 'Progresso', '2026-09-29 19:57:23.149832');
INSERT INTO public.tb_partida_participante VALUES (27, 17, 2, -19.438, -44.225, 'Belo Vale', '2026-09-29 19:58:39.996445');
INSERT INTO public.tb_partida_participante VALUES (28, 17, 1, -19.452, -44.238, 'Progresso', '2026-09-29 19:58:56.140512');


--
-- Data for Name: tb_quadra; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tb_quadra VALUES (2, 'SESC - Serviço Social do Comércio', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4512933, -44.2455551, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (3, 'Huracan Atlético Clube', 'Vapabuçu', 'Rua Brasilia', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4674461, -44.2535697, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (5, 'Campo de Futebol Comunitário #1 — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4494693, -44.2525114, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (6, 'Ginásio Coberto', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4566321, -44.2460268, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (7, 'Campo de Futebol Comunitário #2 — São João', 'São João', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4785549, -44.2219396, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (8, 'Campo de Futebol Comunitário #3 — Progresso', 'Progresso', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4557828, -44.2360719, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (9, 'Campo de Futebol Comunitário #4 — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4586911, -44.2508643, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (10, 'Quadra Poliesportiva #5 — São João', 'São João', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4720198, -44.2430764, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (11, 'Campo de Futebol Comunitário #6 — São João', 'São João', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4725792, -44.2431307, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (12, 'Campo de Futebol Comunitário #7 — São João', 'São João', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4723918, -44.2436888, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (13, 'Campo de Futebol Comunitário #8 — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4504628, -44.2465973, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (15, 'Campo do São João 2', 'Verde Vale', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', true, 'DISPONIVEL', -19.4872448, -44.1546144, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (16, 'Quadra do São João 2', 'Verde Vale', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4866596, -44.1547049, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (17, 'Campo de Futebol Comunitário #9 — Cidade de Deus', 'Cidade de Deus', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4213543, -44.1926081, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (18, 'Campo de Futebol Comunitário #10 — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'SINTETICO', true, 'DISPONIVEL', -19.4524939, -44.2521921, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (19, 'Soccer Sport Center', 'Canaã', 'Avenida Vila Lobos', '35700-000', 'SINTETICO', true, 'DISPONIVEL', -19.4526204, -44.2519468, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (20, 'Campo de Futebol Comunitário #11 — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'SINTETICO', true, 'DISPONIVEL', -19.4526182, -44.2516552, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (21, 'Quadra de Basquete Comunitária — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4511646, -44.2522620, 'BASQUETE, MODALIDADES DE QUADRA');
INSERT INTO public.tb_quadra VALUES (22, 'Campo de Futebol Comunitário #13 — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4510620, -44.2522198, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (23, 'Quadra Poliesportiva #14 — Canaã', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4512571, -44.2520040, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (24, 'Quadra Poliesportiva #15 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', true, 'DISPONIVEL', -19.4459122, -44.2382621, 'TÊNIS');
INSERT INTO public.tb_quadra VALUES (25, 'Quadra Poliesportiva #16 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4461954, -44.2381084, 'TÊNIS');
INSERT INTO public.tb_quadra VALUES (26, 'Quadra Poliesportiva #17 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4458305, -44.2380977, 'TÊNIS');
INSERT INTO public.tb_quadra VALUES (27, 'Quadra Poliesportiva #18 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4461248, -44.2379314, 'TÊNIS');
INSERT INTO public.tb_quadra VALUES (28, 'Quadra Poliesportiva #19 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4460119, -44.2376480, 'TÊNIS');
INSERT INTO public.tb_quadra VALUES (29, 'Quadra Poliesportiva #20 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4457179, -44.2378292, 'TÊNIS');
INSERT INTO public.tb_quadra VALUES (30, 'Campo de Futebol Comunitário #21 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4433408, -44.2392765, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (31, 'Campo de Futebol Comunitário #22 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4436371, -44.2397610, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (32, 'Campo Ajax', 'Belo Vale', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', true, 'DISPONIVEL', -19.4305990, -44.2304438, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (33, 'Campo de Futebol Comunitário #23 — Montreal', 'Montreal', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4960858, -44.3272530, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (34, 'Campo de Futebol Comunitário #24 — Esperança', 'Esperança', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4238162, -44.2483116, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (35, 'Campo de Futebol Comunitário #25 — Cidade de Deus', 'Cidade de Deus', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4181587, -44.2254062, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (36, 'Quadra Poliesportiva #26 — Cidade de Deus', 'Cidade de Deus', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4019288, -44.1838283, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (37, 'Campo de Futebol Comunitário #27 — Cidade de Deus', 'Cidade de Deus', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4018956, -44.1834909, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (38, 'Quadra Poliesportiva #28 — Verde Vale', 'Verde Vale', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4707833, -44.1984312, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (39, 'Quadra Poliesportiva #29 — Cidade de Deus', 'Cidade de Deus', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4212662, -44.1931404, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (40, 'Quadra de Basquete Comunitária — Santa Luzia', 'Santa Luzia', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4550945, -44.2339823, 'BASQUETE, MODALIDADES DE QUADRA');
INSERT INTO public.tb_quadra VALUES (41, 'Pista de Skate Pública — Santa Luzia', 'Santa Luzia', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4547942, -44.2334990, 'SKATE');
INSERT INTO public.tb_quadra VALUES (14, 'Campo do Sertanejo Futebol Clube', 'Verde Vale', 'Rua das Rosas, s/n', '35700-000', 'OUTRO', false, 'DISPONIVEL', -19.4452000, -44.2154000, 'FUTEBOL DE CAMPO');
INSERT INTO public.tb_quadra VALUES (43, 'Quadra Poliesportiva #34 — Montreal', 'Montreal', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4819364, -44.2674521, 'FUTSAL, BASQUETE, VÔLEI');
INSERT INTO public.tb_quadra VALUES (44, 'Campo do Bangu', 'Interlagos', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', true, 'DISPONIVEL', -19.4670451, -44.2230823, 'FUTEBOL DE CAMPO / SOCIETY');
INSERT INTO public.tb_quadra VALUES (45, 'Quadra Poliesportiva #35 — Interlagos', 'Interlagos', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4669136, -44.2223063, 'FUTSAL, HANDEBOL');
INSERT INTO public.tb_quadra VALUES (46, 'Quadra Poliesportiva #36 — São João', 'São João', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', true, 'DISPONIVEL', -19.4707711, -44.2274609, 'FUTSAL, HANDEBOL');
INSERT INTO public.tb_quadra VALUES (4, 'Arena MVP', 'Canaã', 'Região Comunitária de Sete Lagoas', '35700-000', 'AREIA', true, 'DISPONIVEL', -19.4513060, -44.2448117, 'BEACH TENNIS, FUTEVÔLEI, VÔLEI DE AREIA');
INSERT INTO public.tb_quadra VALUES (42, 'Pista de Atletismo e Caminhada — Montreal', 'Montreal', 'Região Comunitária de Sete Lagoas', '35700-000', 'CIMENTO', false, 'DISPONIVEL', -19.4826740, -44.2683411, 'ATLETISMO, CAMINHADA');
INSERT INTO public.tb_quadra VALUES (47, 'Ginásio Coberto Vinício Dias Avelar', 'Belo Vale', 'Av. Circular, s/n', '35702-352', 'CIMENTO', true, 'DISPONIVEL', -19.4385000, -44.2255000, 'FUTSAL, BASQUETE, VOLEIBOL');
INSERT INTO public.tb_quadra VALUES (48, 'Complexo Esportivo do Bairro Progresso (CSU)', 'Progresso', 'Rua Itambacuri, 180', '35700-456', 'CIMENTO', true, 'DISPONIVEL', -19.4522000, -44.2384000, 'FUTSAL, HANDEBOL, BASQUETE');
INSERT INTO public.tb_quadra VALUES (49, 'Centro Esportivo do Bairro Montreal', 'Montreal', 'Av. das Nações, 450', '35701-200', 'CIMENTO', true, 'DISPONIVEL', -19.4751000, -44.2652000, 'FUTSAL, VOLEIBOL, BASQUETE');
INSERT INTO public.tb_quadra VALUES (50, 'Quadra e Pista de Skate da Lagoa Boa Vista', 'Boa Vista', 'Av. Professor Maurílio de Jesus Peixoto', '35700-012', 'ASFALTO', true, 'DISPONIVEL', -19.4628000, -44.2545000, 'SKATE, PATINS, BASQUETE STREET');
INSERT INTO public.tb_quadra VALUES (51, 'Arena MVP Areia e Lazer', 'Canaã', 'Rua Santa Juliana, 1200', '35701-010', 'AREIA', true, 'DISPONIVEL', -19.4512512, -44.2448345, 'BEACH TENNIS, FUTEVÔLEI, VÔLEI DE AREIA');
INSERT INTO public.tb_quadra VALUES (52, 'SESC Sete Lagoas — Espaço Poliesportivo', 'Canaã', 'Rua Dom Pedro II, 280', '35700-050', 'SINTETICO', true, 'DISPONIVEL', -19.4512933, -44.2455551, 'FUTSAL, BASQUETE, NATAÇÃO');
INSERT INTO public.tb_quadra VALUES (53, 'Campo do Bangu Esporte Clube', 'São João', 'Rua José Duarte de Paiva, 890', '35700-060', 'OUTRO', false, 'DISPONIVEL', -19.4721000, -44.2395000, 'FUTEBOL DE CAMPO');
INSERT INTO public.tb_quadra VALUES (54, 'Campo Ajax Comunitário', 'Interlagos', 'Av. Padre Tarcísio Gonçalves, 500', '35701-500', 'OUTRO', false, 'DISPONIVEL', -19.4568000, -44.2265000, 'FUTEBOL DE CAMPO');
INSERT INTO public.tb_quadra VALUES (55, 'Quadra Poliesportiva do Bairro Itapuã', 'Itapuã', 'Rua Diamantina, 320', '35701-120', 'CIMENTO', true, 'DISPONIVEL', -19.4612000, -44.2582000, 'FUTSAL, BASQUETE');
INSERT INTO public.tb_quadra VALUES (56, 'Quadra Comunitária Bairro Cidade de Deus', 'Cidade de Deus', 'Rua Três, 150', '35702-780', 'CIMENTO', false, 'DISPONIVEL', -19.4292000, -44.2185000, 'FUTSAL, VOLEIBOL');
INSERT INTO public.tb_quadra VALUES (57, 'Quadra Poliesportiva Esperança', 'Esperança', 'Av. Circular, s/n', '35702-310', 'CIMENTO', true, 'DISPONIVEL', -19.4421000, -44.2352000, 'FUTSAL, BASQUETE, VOLEIBOL');
INSERT INTO public.tb_quadra VALUES (58, 'Parque Náutico da Lagoa Boa Vista — Quadra Poliesportiva', 'Boa Vista', 'Av. Maurílio de Jesus Peixoto, s/n', '35700-012', 'CIMENTO', true, 'DISPONIVEL', -19.4619000, -44.2538000, 'FUTSAL, BASQUETE');
INSERT INTO public.tb_quadra VALUES (59, 'Quadra Poliesportiva Santa Luzia', 'Santa Luzia', 'Rua Goiás, 410', '35700-340', 'CIMENTO', true, 'DISPONIVEL', -19.4582000, -44.2325000, 'FUTSAL, VOLEIBOL');
INSERT INTO public.tb_quadra VALUES (60, 'Huracan Atlético Clube — Quadra e Campo', 'Carmo', 'Rua Princesa Isabel, 210', '35700-140', 'CIMENTO', false, 'DISPONIVEL', -19.4674461, -44.2535697, 'FUTSAL, FUTEBOL');


--
-- Data for Name: tb_reserva; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tb_reserva VALUES (1, 40, 2, '2026-09-09 18:00:00', '2026-09-09 19:00:00', 'PARTIDA_AVULSA', 'CANCELADA', '2026-09-08 20:52:31.981504');


--
-- Data for Name: tb_turma_social; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: tb_usuario; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.tb_usuario VALUES (2, 'Vinícius Castilho de Souza e Silva', 'viniciuscastilho8@gmail.com', '31988887777', '22233344455', '$2a$10$Xv/JHPS.P/rlAzO7.LYoC.OX7UpeCogK/xATtpa5ira2kDjBzKyYu', 'ROLE_COMUNIDADE', true, 'http://localhost:8080/uploads/perfis/50eda005-fe6c-4d84-99c7-2005f7b87574.jpg', 'PRATICAR_ESPORTES', 5, 2, 'JOGADOR_AMADOR', 2.5, 2, 2, 0);
INSERT INTO public.tb_usuario VALUES (1, 'Gestor Municipal', 'gestor@setelagoas.mg.gov.br', '31999998888', '11144477735', '$2a$10$u88X8Fb4wqT5B0QoMJXmGeqa7YxEKxraIlEguPBY.xwLHPLsSBESi', 'ROLE_GESTOR', true, 'http://localhost:8080/uploads/perfis/a86893c9-29ba-4274-9f5a-78ad7358e72b.jpg', 'PROMOVER_AULAS', 5, 0, 'JOGADOR_AMADOR', NULL, 0, 0, 0);


--
-- Name: tb_avaliacao_usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_avaliacao_usuario_id_seq', 2, true);


--
-- Name: tb_chamado_zeladoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_chamado_zeladoria_id_seq', 1, false);


--
-- Name: tb_mensagem_partida_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_mensagem_partida_id_seq', 41, true);


--
-- Name: tb_partida_match_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_partida_match_id_seq', 17, true);


--
-- Name: tb_partida_participante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_partida_participante_id_seq', 28, true);


--
-- Name: tb_quadra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_quadra_id_seq', 60, true);


--
-- Name: tb_reserva_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_reserva_id_seq', 1, true);


--
-- Name: tb_turma_social_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_turma_social_id_seq', 1, false);


--
-- Name: tb_usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tb_usuario_id_seq', 2, true);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: tb_avaliacao_usuario tb_avaliacao_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacao_usuario
    ADD CONSTRAINT tb_avaliacao_usuario_pkey PRIMARY KEY (id);


--
-- Name: tb_chamado_zeladoria tb_chamado_zeladoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_chamado_zeladoria
    ADD CONSTRAINT tb_chamado_zeladoria_pkey PRIMARY KEY (id);


--
-- Name: tb_mensagem_partida tb_mensagem_partida_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagem_partida
    ADD CONSTRAINT tb_mensagem_partida_pkey PRIMARY KEY (id);


--
-- Name: tb_partida_match tb_partida_match_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_match
    ADD CONSTRAINT tb_partida_match_pkey PRIMARY KEY (id);


--
-- Name: tb_partida_participante tb_partida_participante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_participante
    ADD CONSTRAINT tb_partida_participante_pkey PRIMARY KEY (id);


--
-- Name: tb_quadra tb_quadra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_quadra
    ADD CONSTRAINT tb_quadra_pkey PRIMARY KEY (id);


--
-- Name: tb_reserva tb_reserva_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reserva
    ADD CONSTRAINT tb_reserva_pkey PRIMARY KEY (id);


--
-- Name: tb_turma_social tb_turma_social_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_turma_social
    ADD CONSTRAINT tb_turma_social_pkey PRIMARY KEY (id);


--
-- Name: tb_usuario tb_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_usuario
    ADD CONSTRAINT tb_usuario_pkey PRIMARY KEY (id);


--
-- Name: tb_avaliacao_usuario uk_avaliacao_partida_par; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacao_usuario
    ADD CONSTRAINT uk_avaliacao_partida_par UNIQUE (partida_id, avaliador_id, avaliado_id);


--
-- Name: tb_partida_participante uk_partida_participante; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_participante
    ADD CONSTRAINT uk_partida_participante UNIQUE (partida_id, usuario_id);


--
-- Name: tb_reserva uk_reserva_sem_sobreposicao; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reserva
    ADD CONSTRAINT uk_reserva_sem_sobreposicao EXCLUDE USING gist (quadra_id WITH =, tsrange(data_inicio, data_fim) WITH &&) WHERE (((status)::text = 'CONFIRMADA'::text));


--
-- Name: tb_usuario uk_usuario_cpf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_usuario
    ADD CONSTRAINT uk_usuario_cpf UNIQUE (cpf);


--
-- Name: tb_usuario uk_usuario_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_usuario
    ADD CONSTRAINT uk_usuario_email UNIQUE (email);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_avaliacao_avaliado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacao_avaliado ON public.tb_avaliacao_usuario USING btree (avaliado_id);


--
-- Name: idx_avaliacao_partida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_avaliacao_partida ON public.tb_avaliacao_usuario USING btree (partida_id);


--
-- Name: idx_chamado_quadra_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chamado_quadra_status ON public.tb_chamado_zeladoria USING btree (quadra_id, status);


--
-- Name: idx_mensagem_partida_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagem_partida_criado_em ON public.tb_mensagem_partida USING btree (partida_id, criado_em);


--
-- Name: idx_mensagem_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mensagem_usuario ON public.tb_mensagem_partida USING btree (usuario_id);


--
-- Name: idx_participante_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participante_usuario ON public.tb_partida_participante USING btree (usuario_id);


--
-- Name: idx_partida_criador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partida_criador ON public.tb_partida_match USING btree (criador_id);


--
-- Name: idx_partida_data_hora; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partida_data_hora ON public.tb_partida_match USING btree (data_hora);


--
-- Name: idx_partida_esporte_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_partida_esporte_status ON public.tb_partida_match USING btree (esporte, status);


--
-- Name: idx_reserva_quadra_datas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserva_quadra_datas ON public.tb_reserva USING btree (quadra_id, data_inicio, data_fim);


--
-- Name: idx_reserva_usuario_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reserva_usuario_status ON public.tb_reserva USING btree (usuario_id, status);


--
-- Name: idx_turma_quadra_dia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_turma_quadra_dia ON public.tb_turma_social USING btree (quadra_id, dia_semana);


--
-- Name: tb_chamado_zeladoria fk_chamado_autor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_chamado_zeladoria
    ADD CONSTRAINT fk_chamado_autor FOREIGN KEY (autor_id) REFERENCES public.tb_usuario(id);


--
-- Name: tb_chamado_zeladoria fk_chamado_quadra; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_chamado_zeladoria
    ADD CONSTRAINT fk_chamado_quadra FOREIGN KEY (quadra_id) REFERENCES public.tb_quadra(id) ON DELETE CASCADE;


--
-- Name: tb_mensagem_partida fk_mensagem_partida; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagem_partida
    ADD CONSTRAINT fk_mensagem_partida FOREIGN KEY (partida_id) REFERENCES public.tb_partida_match(id) ON DELETE CASCADE;


--
-- Name: tb_mensagem_partida fk_mensagem_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_mensagem_partida
    ADD CONSTRAINT fk_mensagem_usuario FOREIGN KEY (usuario_id) REFERENCES public.tb_usuario(id) ON DELETE SET NULL;


--
-- Name: tb_partida_participante fk_participante_partida; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_participante
    ADD CONSTRAINT fk_participante_partida FOREIGN KEY (partida_id) REFERENCES public.tb_partida_match(id) ON DELETE CASCADE;


--
-- Name: tb_partida_participante fk_participante_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_participante
    ADD CONSTRAINT fk_participante_usuario FOREIGN KEY (usuario_id) REFERENCES public.tb_usuario(id) ON DELETE CASCADE;


--
-- Name: tb_partida_match fk_partida_criador; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_match
    ADD CONSTRAINT fk_partida_criador FOREIGN KEY (criador_id) REFERENCES public.tb_usuario(id) ON DELETE CASCADE;


--
-- Name: tb_partida_match fk_partida_quadra_escolhida; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_partida_match
    ADD CONSTRAINT fk_partida_quadra_escolhida FOREIGN KEY (quadra_escolhida_id) REFERENCES public.tb_quadra(id) ON DELETE SET NULL;


--
-- Name: tb_reserva fk_reserva_quadra; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reserva
    ADD CONSTRAINT fk_reserva_quadra FOREIGN KEY (quadra_id) REFERENCES public.tb_quadra(id) ON DELETE CASCADE;


--
-- Name: tb_reserva fk_reserva_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_reserva
    ADD CONSTRAINT fk_reserva_usuario FOREIGN KEY (usuario_id) REFERENCES public.tb_usuario(id);


--
-- Name: tb_turma_social fk_turma_instrutor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_turma_social
    ADD CONSTRAINT fk_turma_instrutor FOREIGN KEY (instrutor_id) REFERENCES public.tb_usuario(id);


--
-- Name: tb_turma_social fk_turma_quadra; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_turma_social
    ADD CONSTRAINT fk_turma_quadra FOREIGN KEY (quadra_id) REFERENCES public.tb_quadra(id) ON DELETE CASCADE;


--
-- Name: tb_avaliacao_usuario tb_avaliacao_usuario_avaliado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacao_usuario
    ADD CONSTRAINT tb_avaliacao_usuario_avaliado_id_fkey FOREIGN KEY (avaliado_id) REFERENCES public.tb_usuario(id) ON DELETE CASCADE;


--
-- Name: tb_avaliacao_usuario tb_avaliacao_usuario_avaliador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacao_usuario
    ADD CONSTRAINT tb_avaliacao_usuario_avaliador_id_fkey FOREIGN KEY (avaliador_id) REFERENCES public.tb_usuario(id) ON DELETE CASCADE;


--
-- Name: tb_avaliacao_usuario tb_avaliacao_usuario_partida_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tb_avaliacao_usuario
    ADD CONSTRAINT tb_avaliacao_usuario_partida_id_fkey FOREIGN KEY (partida_id) REFERENCES public.tb_partida_match(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ocK0aKrQTdTNyHy4RthCZyMzJcAjoO1HjdQ6szFYcO2reqKjsyF2J9WzxSNkhkc

