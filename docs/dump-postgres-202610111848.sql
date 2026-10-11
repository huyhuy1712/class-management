--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.0

-- Started on 2026-10-11 18:48:23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 38 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 38
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 413 (class 1259 OID 18507)
-- Name: absence_request_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absence_request_details (
    request_id bigint NOT NULL,
    lesson_id bigint NOT NULL
);


--
-- TOC entry 425 (class 1259 OID 18741)
-- Name: answer_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.answer_options (
    id bigint NOT NULL,
    answer_id bigint NOT NULL,
    content text,
    image_url text,
    audio_url text,
    is_correct boolean DEFAULT false NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    points numeric(6,2) DEFAULT 0 NOT NULL,
    CONSTRAINT chk_answer_options_points CHECK ((points >= (0)::numeric))
);


--
-- TOC entry 424 (class 1259 OID 18740)
-- Name: answer_options_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.answer_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 424
-- Name: answer_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.answer_options_id_seq OWNED BY public.answer_options.id;


--
-- TOC entry 423 (class 1259 OID 18718)
-- Name: answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.answers (
    id bigint NOT NULL,
    question_id bigint NOT NULL,
    answer_type character varying(30) NOT NULL,
    content text,
    image_url text,
    audio_url text,
    order_index integer NOT NULL,
    points numeric(6,2) DEFAULT 0 NOT NULL,
    correct_answer_text text,
    correct_boolean boolean,
    case_sensitive boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    scoring_type character varying(30) DEFAULT 'PER_ANSWER'::character varying NOT NULL,
    CONSTRAINT chk_answers_points CHECK ((points >= (0)::numeric)),
    CONSTRAINT chk_answers_scoring_type CHECK (((scoring_type)::text = ANY ((ARRAY['PER_ANSWER'::character varying, 'CORRECT_COUNT'::character varying])::text[]))),
    CONSTRAINT chk_answers_type CHECK (((answer_type)::text = ANY ((ARRAY['SINGLE_CHOICE'::character varying, 'MULTIPLE_CHOICE'::character varying, 'TRUE_FALSE'::character varying, 'SHORT_ANSWER'::character varying, 'FILL_BLANK'::character varying, 'ESSAY'::character varying])::text[])))
);


--
-- TOC entry 422 (class 1259 OID 18717)
-- Name: answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 422
-- Name: answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.answers_id_seq OWNED BY public.answers.id;


--
-- TOC entry 437 (class 1259 OID 18890)
-- Name: attempt_section_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attempt_section_scores (
    id bigint NOT NULL,
    attempt_id bigint NOT NULL,
    section_id bigint NOT NULL,
    auto_score numeric(6,2) DEFAULT 0 NOT NULL,
    manual_score numeric(6,2) DEFAULT 0 NOT NULL,
    total_score numeric(6,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_attempt_section_scores_values CHECK (((auto_score >= (0)::numeric) AND (manual_score >= (0)::numeric) AND (total_score >= (0)::numeric)))
);


--
-- TOC entry 436 (class 1259 OID 18889)
-- Name: attempt_section_scores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attempt_section_scores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 436
-- Name: attempt_section_scores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attempt_section_scores_id_seq OWNED BY public.attempt_section_scores.id;


--
-- TOC entry 407 (class 1259 OID 17744)
-- Name: attendances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendances (
    id bigint NOT NULL,
    class_id bigint NOT NULL,
    student_id bigint NOT NULL,
    date date NOT NULL,
    status character varying(20) NOT NULL,
    note text,
    lesson_id bigint,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_attendances_status CHECK (((status)::text = ANY ((ARRAY['PRESENT'::character varying, 'ABSENT'::character varying, 'LATE'::character varying])::text[])))
);


--
-- TOC entry 406 (class 1259 OID 17743)
-- Name: attendances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendances_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 406
-- Name: attendances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;


--
-- TOC entry 412 (class 1259 OID 18492)
-- Name: class_join_request_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_join_request_details (
    request_id bigint NOT NULL,
    class_id bigint NOT NULL
);


--
-- TOC entry 403 (class 1259 OID 17711)
-- Name: class_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_students (
    class_id bigint NOT NULL,
    student_id bigint NOT NULL,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 402 (class 1259 OID 17687)
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    subject_id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    description text,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    academic_year character varying(9) NOT NULL,
    CONSTRAINT chk_classes_status CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'ARCHIVED'::character varying])::text[])))
);


--
-- TOC entry 401 (class 1259 OID 17686)
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.classes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 401
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- TOC entry 430 (class 1259 OID 18805)
-- Name: exam_assignment_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_assignment_classes (
    assignment_id bigint NOT NULL,
    class_id bigint NOT NULL
);


--
-- TOC entry 431 (class 1259 OID 18821)
-- Name: exam_assignment_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_assignment_students (
    assignment_id bigint NOT NULL,
    student_id bigint NOT NULL,
    class_id bigint
);


--
-- TOC entry 429 (class 1259 OID 18783)
-- Name: exam_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_assignments (
    id bigint NOT NULL,
    exam_id bigint NOT NULL,
    assignment_type character varying(20) NOT NULL,
    open_time timestamp without time zone,
    close_time timestamp without time zone,
    time_limit integer,
    max_attempts integer,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    score_visibility character varying(30) DEFAULT 'NEVER'::character varying NOT NULL,
    answer_visibility character varying(30) DEFAULT 'NEVER'::character varying NOT NULL,
    answer_visibility_score numeric(6,2),
    hide_correct_answer_on_wrong boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_exam_assignments_answer_visibility CHECK (((answer_visibility)::text = ANY ((ARRAY['NEVER'::character varying, 'AFTER_SUBMIT'::character varying, 'AFTER_EXAM'::character varying, 'AFTER_SCORE'::character varying])::text[]))),
    CONSTRAINT chk_exam_assignments_answer_visibility_score CHECK (((answer_visibility_score IS NULL) OR (answer_visibility_score >= (0)::numeric))),
    CONSTRAINT chk_exam_assignments_max_attempts CHECK (((max_attempts IS NULL) OR (max_attempts >= 0))),
    CONSTRAINT chk_exam_assignments_score_visibility CHECK (((score_visibility)::text = ANY ((ARRAY['NEVER'::character varying, 'AFTER_SUBMIT'::character varying, 'AFTER_EXAM'::character varying])::text[]))),
    CONSTRAINT chk_exam_assignments_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'SCHEDULED'::character varying, 'OPEN'::character varying, 'CLOSED'::character varying])::text[]))),
    CONSTRAINT chk_exam_assignments_time CHECK (((open_time IS NULL) OR (close_time IS NULL) OR (open_time <= close_time))),
    CONSTRAINT chk_exam_assignments_time_limit CHECK (((time_limit IS NULL) OR (time_limit >= 0))),
    CONSTRAINT chk_exam_assignments_type CHECK (((assignment_type)::text = ANY ((ARRAY['ALL'::character varying, 'CLASS'::character varying, 'STUDENT'::character varying])::text[])))
);


--
-- TOC entry 428 (class 1259 OID 18782)
-- Name: exam_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 428
-- Name: exam_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_assignments_id_seq OWNED BY public.exam_assignments.id;


--
-- TOC entry 435 (class 1259 OID 18874)
-- Name: exam_attempt_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_attempt_events (
    id bigint NOT NULL,
    attempt_id bigint NOT NULL,
    event_type character varying(30) NOT NULL,
    event_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_exam_attempt_events_type CHECK (((event_type)::text = ANY ((ARRAY['TAB_HIDDEN'::character varying, 'TAB_VISIBLE'::character varying])::text[])))
);


--
-- TOC entry 434 (class 1259 OID 18873)
-- Name: exam_attempt_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_attempt_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 434
-- Name: exam_attempt_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_attempt_events_id_seq OWNED BY public.exam_attempt_events.id;


--
-- TOC entry 433 (class 1259 OID 18838)
-- Name: exam_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_attempts (
    id bigint NOT NULL,
    assignment_id bigint NOT NULL,
    student_id bigint NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    tab_switch_count integer DEFAULT 0 NOT NULL,
    started_at timestamp without time zone,
    submitted_at timestamp without time zone,
    duration_seconds integer,
    auto_score numeric(6,2) DEFAULT 0 NOT NULL,
    manual_score numeric(6,2) DEFAULT 0 NOT NULL,
    total_score numeric(6,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'NOT_STARTED'::character varying NOT NULL,
    teacher_comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_exam_attempts_attempt_count CHECK ((attempt_count >= 0)),
    CONSTRAINT chk_exam_attempts_duration CHECK (((duration_seconds IS NULL) OR (duration_seconds >= 0))),
    CONSTRAINT chk_exam_attempts_scores CHECK (((auto_score >= (0)::numeric) AND (manual_score >= (0)::numeric) AND (total_score >= (0)::numeric))),
    CONSTRAINT chk_exam_attempts_status CHECK (((status)::text = ANY ((ARRAY['NOT_STARTED'::character varying, 'IN_PROGRESS'::character varying, 'SUBMITTED'::character varying, 'GRADED'::character varying])::text[]))),
    CONSTRAINT chk_exam_attempts_tab_switch_count CHECK ((tab_switch_count >= 0))
);


--
-- TOC entry 432 (class 1259 OID 18837)
-- Name: exam_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_attempts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 432
-- Name: exam_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_attempts_id_seq OWNED BY public.exam_attempts.id;


--
-- TOC entry 443 (class 1259 OID 19045)
-- Name: exam_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_media (
    id uuid NOT NULL,
    teacher_id bigint NOT NULL,
    draft_token uuid NOT NULL,
    object_path character varying(500) NOT NULL,
    media_type character varying(10) NOT NULL,
    content_type character varying(100) NOT NULL,
    size_bytes bigint NOT NULL,
    status character varying(20) NOT NULL,
    exam_id bigint,
    created_at timestamp without time zone NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    next_cleanup_at timestamp without time zone NOT NULL,
    cleanup_attempts integer DEFAULT 0 NOT NULL,
    CONSTRAINT exam_media_cleanup_attempts_check CHECK ((cleanup_attempts >= 0)),
    CONSTRAINT exam_media_media_type_check CHECK (((media_type)::text = ANY ((ARRAY['IMAGE'::character varying, 'AUDIO'::character varying])::text[]))),
    CONSTRAINT exam_media_size_bytes_check CHECK ((size_bytes > 0)),
    CONSTRAINT exam_media_status_check CHECK (((status)::text = ANY ((ARRAY['UPLOADING'::character varying, 'TEMP'::character varying, 'ATTACHED'::character varying, 'DELETE_PENDING'::character varying])::text[])))
);


--
-- TOC entry 419 (class 1259 OID 18674)
-- Name: exam_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exam_sections (
    id bigint NOT NULL,
    exam_id bigint NOT NULL,
    title character varying(255) NOT NULL,
    paragraph text,
    image_url text,
    audio_url text,
    order_index integer NOT NULL,
    points numeric(6,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_exam_sections_points CHECK ((points >= (0)::numeric))
);


--
-- TOC entry 418 (class 1259 OID 18673)
-- Name: exam_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exam_sections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 418
-- Name: exam_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exam_sections_id_seq OWNED BY public.exam_sections.id;


--
-- TOC entry 417 (class 1259 OID 18644)
-- Name: exams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exams (
    id bigint NOT NULL,
    teacher_id bigint NOT NULL,
    subject_id bigint,
    title character varying(255) NOT NULL,
    description text,
    grade_level character varying(30),
    purpose character varying(50),
    time_limit integer,
    max_attempts integer,
    max_score numeric(6,2) DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    code character varying(50) NOT NULL,
    revision bigint DEFAULT 0 NOT NULL,
    CONSTRAINT chk_exams_max_attempts CHECK (((max_attempts IS NULL) OR (max_attempts >= 0))),
    CONSTRAINT chk_exams_max_score CHECK ((max_score >= (0)::numeric)),
    CONSTRAINT chk_exams_revision CHECK ((revision >= 0)),
    CONSTRAINT chk_exams_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PUBLISHED'::character varying, 'CLOSED'::character varying])::text[]))),
    CONSTRAINT chk_exams_time_limit CHECK (((time_limit IS NULL) OR (time_limit >= 0)))
);


--
-- TOC entry 416 (class 1259 OID 18643)
-- Name: exams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exams_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 416
-- Name: exams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exams_id_seq OWNED BY public.exams.id;


--
-- TOC entry 396 (class 1259 OID 17597)
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
-- TOC entry 409 (class 1259 OID 18439)
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id bigint NOT NULL,
    class_id bigint NOT NULL,
    title character varying(255),
    lesson_date date NOT NULL,
    attendance_code character varying(100) NOT NULL,
    start_time timestamp without time zone NOT NULL,
    late_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_lessons_time CHECK (((start_time <= late_time) AND (late_time <= end_time)))
);


--
-- TOC entry 408 (class 1259 OID 18438)
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lessons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 408
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- TOC entry 405 (class 1259 OID 17728)
-- Name: materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials (
    id bigint NOT NULL,
    class_id bigint NOT NULL,
    type character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    file_url character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_materials_type CHECK (((type)::text = ANY ((ARRAY['ANNOUNCEMENT'::character varying, 'DOCUMENT'::character varying])::text[])))
);


--
-- TOC entry 404 (class 1259 OID 17727)
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.materials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 404
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- TOC entry 415 (class 1259 OID 18524)
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    reference_type character varying(50),
    reference_id bigint,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 414 (class 1259 OID 18523)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 414
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 427 (class 1259 OID 18761)
-- Name: question_scoring_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_scoring_rules (
    id bigint NOT NULL,
    correct_count integer NOT NULL,
    score numeric(6,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    answer_id bigint NOT NULL,
    CONSTRAINT chk_question_scoring_rules_correct_count CHECK ((correct_count >= 0)),
    CONSTRAINT chk_question_scoring_rules_score CHECK ((score >= (0)::numeric))
);


--
-- TOC entry 426 (class 1259 OID 18760)
-- Name: question_scoring_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_scoring_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 426
-- Name: question_scoring_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.question_scoring_rules_id_seq OWNED BY public.question_scoring_rules.id;


--
-- TOC entry 421 (class 1259 OID 18695)
-- Name: questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions (
    id bigint NOT NULL,
    section_id bigint NOT NULL,
    content text NOT NULL,
    image_url text,
    audio_url text,
    order_index integer NOT NULL,
    points numeric(6,2) DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_questions_points CHECK ((points >= (0)::numeric))
);


--
-- TOC entry 420 (class 1259 OID 18694)
-- Name: questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 420
-- Name: questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_id_seq OWNED BY public.questions.id;


--
-- TOC entry 411 (class 1259 OID 18466)
-- Name: requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.requests (
    id bigint NOT NULL,
    sender_id bigint NOT NULL,
    receiver_id bigint,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    title character varying(255),
    message text,
    response_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    responded_at timestamp without time zone,
    CONSTRAINT chk_requests_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- TOC entry 410 (class 1259 OID 18465)
-- Name: requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 410
-- Name: requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;


--
-- TOC entry 442 (class 1259 OID 18974)
-- Name: student_answer_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_answer_options (
    answer_value_id bigint NOT NULL,
    option_id bigint NOT NULL,
    boolean_value boolean
);


--
-- TOC entry 441 (class 1259 OID 18950)
-- Name: student_answer_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_answer_values (
    id bigint NOT NULL,
    student_answer_id bigint NOT NULL,
    answer_id bigint NOT NULL,
    answer_text text,
    score numeric(6,2),
    is_correct boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_student_answer_values_score CHECK (((score IS NULL) OR (score >= (0)::numeric)))
);


--
-- TOC entry 440 (class 1259 OID 18949)
-- Name: student_answer_values_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_answer_values_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 440
-- Name: student_answer_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_answer_values_id_seq OWNED BY public.student_answer_values.id;


--
-- TOC entry 439 (class 1259 OID 18916)
-- Name: student_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_answers (
    id bigint NOT NULL,
    attempt_id bigint NOT NULL,
    question_id bigint NOT NULL,
    auto_score numeric(6,2),
    manual_score numeric(6,2),
    grading_status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    teacher_comment text,
    graded_by bigint,
    graded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_student_answers_auto_score CHECK (((auto_score IS NULL) OR (auto_score >= (0)::numeric))),
    CONSTRAINT chk_student_answers_grading_status CHECK (((grading_status)::text = ANY ((ARRAY['PENDING'::character varying, 'AUTO_GRADED'::character varying, 'MANUAL_GRADED'::character varying])::text[]))),
    CONSTRAINT chk_student_answers_manual_score CHECK (((manual_score IS NULL) OR (manual_score >= (0)::numeric)))
);


--
-- TOC entry 438 (class 1259 OID 18915)
-- Name: student_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_answers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 438
-- Name: student_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.student_answers_id_seq OWNED BY public.student_answers.id;


--
-- TOC entry 400 (class 1259 OID 17676)
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) NOT NULL,
    description text
);


--
-- TOC entry 399 (class 1259 OID 17675)
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subjects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 399
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- TOC entry 398 (class 1259 OID 17607)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(100) NOT NULL,
    phone character varying(20),
    avatar character varying(500),
    role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    student_code character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    teacher_code character varying(255),
    CONSTRAINT chk_users_role CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'TEACHER'::character varying, 'STUDENT'::character varying])::text[]))),
    CONSTRAINT chk_users_status CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ACTIVE'::character varying, 'BANNED'::character varying])::text[])))
);


--
-- TOC entry 397 (class 1259 OID 17606)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 397
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3855 (class 2604 OID 18744)
-- Name: answer_options id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answer_options ALTER COLUMN id SET DEFAULT nextval('public.answer_options_id_seq'::regclass);


--
-- TOC entry 3849 (class 2604 OID 18721)
-- Name: answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers ALTER COLUMN id SET DEFAULT nextval('public.answers_id_seq'::regclass);


--
-- TOC entry 3882 (class 2604 OID 18893)
-- Name: attempt_section_scores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt_section_scores ALTER COLUMN id SET DEFAULT nextval('public.attempt_section_scores_id_seq'::regclass);


--
-- TOC entry 3823 (class 2604 OID 17747)
-- Name: attendances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq'::regclass);


--
-- TOC entry 3816 (class 2604 OID 17690)
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- TOC entry 3863 (class 2604 OID 18786)
-- Name: exam_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignments ALTER COLUMN id SET DEFAULT nextval('public.exam_assignments_id_seq'::regclass);


--
-- TOC entry 3879 (class 2604 OID 18877)
-- Name: exam_attempt_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempt_events ALTER COLUMN id SET DEFAULT nextval('public.exam_attempt_events_id_seq'::regclass);


--
-- TOC entry 3870 (class 2604 OID 18841)
-- Name: exam_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempts ALTER COLUMN id SET DEFAULT nextval('public.exam_attempts_id_seq'::regclass);


--
-- TOC entry 3841 (class 2604 OID 18677)
-- Name: exam_sections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_sections ALTER COLUMN id SET DEFAULT nextval('public.exam_sections_id_seq'::regclass);


--
-- TOC entry 3835 (class 2604 OID 18647)
-- Name: exams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams ALTER COLUMN id SET DEFAULT nextval('public.exams_id_seq'::regclass);


--
-- TOC entry 3825 (class 2604 OID 18442)
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- TOC entry 3821 (class 2604 OID 17731)
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- TOC entry 3832 (class 2604 OID 18527)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 3860 (class 2604 OID 18764)
-- Name: question_scoring_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_scoring_rules ALTER COLUMN id SET DEFAULT nextval('public.question_scoring_rules_id_seq'::regclass);


--
-- TOC entry 3845 (class 2604 OID 18698)
-- Name: questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions ALTER COLUMN id SET DEFAULT nextval('public.questions_id_seq'::regclass);


--
-- TOC entry 3828 (class 2604 OID 18469)
-- Name: requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);


--
-- TOC entry 3892 (class 2604 OID 18953)
-- Name: student_answer_values id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_values ALTER COLUMN id SET DEFAULT nextval('public.student_answer_values_id_seq'::regclass);


--
-- TOC entry 3888 (class 2604 OID 18919)
-- Name: student_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers ALTER COLUMN id SET DEFAULT nextval('public.student_answers_id_seq'::regclass);


--
-- TOC entry 3815 (class 2604 OID 17679)
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- TOC entry 3811 (class 2604 OID 17610)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4280 (class 0 OID 18507)
-- Dependencies: 413
-- Data for Name: absence_request_details; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4292 (class 0 OID 18741)
-- Dependencies: 425
-- Data for Name: answer_options; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.answer_options VALUES (4, 3, 'for a certain product to be seen directly', NULL, NULL, false, 1, '2026-10-09 12:04:41.570932', '2026-10-09 12:04:41.570932', 0.00);
INSERT INTO public.answer_options VALUES (5, 3, 'what are the products we will be certainly seeing directly', NULL, NULL, false, 2, '2026-10-09 12:04:41.712041', '2026-10-09 12:04:41.712041', 0.00);
INSERT INTO public.answer_options VALUES (6, 3, 'until we certainly see its products directly', NULL, NULL, false, 3, '2026-10-09 12:04:41.840081', '2026-10-09 12:04:41.840081', 0.00);
INSERT INTO public.answer_options VALUES (7, 3, 'being uncertain about the product until seeing it directly', NULL, NULL, true, 4, '2026-10-09 12:04:41.968217', '2026-10-09 12:04:41.968217', 0.00);
INSERT INTO public.answer_options VALUES (8, 4, 'but do not present any risks and barriers to tourism itself', NULL, NULL, false, 1, '2026-10-09 12:04:42.096313', '2026-10-09 12:04:42.096313', 0.00);
INSERT INTO public.answer_options VALUES (9, 4, 'if the barrier of tourism itself is not in the presence of risk', NULL, NULL, false, 2, '2026-10-09 12:04:42.229905', '2026-10-09 12:04:42.229905', 0.00);
INSERT INTO public.answer_options VALUES (10, 4, 'so the presence of risk is not in itself a barrier to tourism', NULL, NULL, true, 3, '2026-10-09 12:04:42.363119', '2026-10-09 12:04:42.363119', 0.00);
INSERT INTO public.answer_options VALUES (11, 4, 'and tourism itself does not present any barriers or risks', NULL, NULL, false, 4, '2026-10-09 12:04:42.496447', '2026-10-09 12:04:42.496447', 0.00);
INSERT INTO public.answer_options VALUES (12, 5, 'As a result, there will be much less concern about the risk of poor weather than about the risk of crime', NULL, NULL, true, 1, '2026-10-09 12:04:42.629625', '2026-10-09 12:04:42.629625', 0.00);
INSERT INTO public.answer_options VALUES (13, 5, 'Similarly, the concern about the risk of poor weather will be much greater than that about the risk of crime', NULL, NULL, false, 2, '2026-10-09 12:04:42.763154', '2026-10-09 12:04:42.763154', 0.00);
INSERT INTO public.answer_options VALUES (14, 5, 'As earlier mentioned, the risk of crime will be of much greater concern to people than that of poor weather', NULL, NULL, false, 3, '2026-10-09 12:04:42.896637', '2026-10-09 12:04:42.896637', 0.00);
INSERT INTO public.answer_options VALUES (15, 5, 'People, by contrast, will be far less concerned about the risk of crime than about that of poor weather', NULL, NULL, false, 4, '2026-10-09 12:04:43.029886', '2026-10-09 12:04:43.029886', 0.00);
INSERT INTO public.answer_options VALUES (16, 6, 'Holidays are also booked after customers choose factors and methods without risk', NULL, NULL, false, 1, '2026-10-09 12:04:43.163251', '2026-10-09 12:04:43.163251', 0.00);
INSERT INTO public.answer_options VALUES (17, 6, 'Customers also book their holidays by choosing the methods without risky factors', NULL, NULL, false, 2, '2026-10-09 12:04:43.296425', '2026-10-09 12:04:43.296425', 0.00);
INSERT INTO public.answer_options VALUES (18, 6, 'Risk is also a factor in the methods chosen by customers to book their holidays', NULL, NULL, true, 3, '2026-10-09 12:04:43.429645', '2026-10-09 12:04:43.429645', 0.00);
INSERT INTO public.answer_options VALUES (19, 6, 'Also, the factors and methods customers choose to book their holidays are risky', NULL, NULL, false, 4, '2026-10-09 12:04:43.562915', '2026-10-09 12:04:43.562915', 0.00);
INSERT INTO public.answer_options VALUES (20, 7, 'the suspicion that information received through the Internet will be biased', NULL, NULL, true, 1, '2026-10-09 12:04:43.696376', '2026-10-09 12:04:43.696376', 0.00);
INSERT INTO public.answer_options VALUES (21, 7, 'due to the Internet, through which biased and suspicious information is received', NULL, NULL, false, 2, '2026-10-09 12:04:43.829866', '2026-10-09 12:04:43.829866', 0.00);
INSERT INTO public.answer_options VALUES (22, 7, 'the biased information received through the Internet will be suspicious', NULL, NULL, false, 3, '2026-10-09 12:04:43.963356', '2026-10-09 12:04:43.963356', 0.00);
INSERT INTO public.answer_options VALUES (23, 7, 'thanks to the biased Information received through the Internet with the suspicion', NULL, NULL, false, 4, '2026-10-09 12:04:44.096415', '2026-10-09 12:04:44.096415', 0.00);
INSERT INTO public.answer_options VALUES (24, 8, 'blant growth', NULL, NULL, false, 1, '2026-10-09 12:04:44.229992', '2026-10-09 12:04:44.229992', 0.00);
INSERT INTO public.answer_options VALUES (25, 8, 'data analytics', NULL, NULL, true, 2, '2026-10-09 12:04:44.366796', '2026-10-09 12:04:44.366796', 0.00);
INSERT INTO public.answer_options VALUES (26, 8, 'soll conditions', NULL, NULL, false, 3, '2026-10-09 12:04:44.500384', '2026-10-09 12:04:44.500384', 0.00);
INSERT INTO public.answer_options VALUES (27, 8, 'weather patterns', NULL, NULL, false, 4, '2026-10-09 12:04:44.633762', '2026-10-09 12:04:44.633762', 0.00);
INSERT INTO public.answer_options VALUES (28, 9, 'guide', NULL, NULL, false, 1, '2026-10-09 12:04:44.77131', '2026-10-09 12:04:44.77131', 0.00);
INSERT INTO public.answer_options VALUES (29, 9, 'require', NULL, NULL, false, 2, '2026-10-09 12:04:44.904854', '2026-10-09 12:04:44.904854', 0.00);
INSERT INTO public.answer_options VALUES (30, 9, 'install', NULL, NULL, false, 3, '2026-10-09 12:04:45.037951', '2026-10-09 12:04:45.037951', 0.00);
INSERT INTO public.answer_options VALUES (31, 9, 'speed', NULL, NULL, true, 4, '2026-10-09 12:04:45.171359', '2026-10-09 12:04:45.171359', 0.00);
INSERT INTO public.answer_options VALUES (32, 10, 'Increase', NULL, NULL, true, 1, '2026-10-09 12:04:45.304729', '2026-10-09 12:04:45.304729', 0.00);
INSERT INTO public.answer_options VALUES (33, 10, 'monitor', NULL, NULL, false, 2, '2026-10-09 12:04:45.437797', '2026-10-09 12:04:45.437797', 0.00);
INSERT INTO public.answer_options VALUES (34, 10, 'reduce', NULL, NULL, false, 3, '2026-10-09 12:04:45.572162', '2026-10-09 12:04:45.572162', 0.00);
INSERT INTO public.answer_options VALUES (35, 10, 'limit', NULL, NULL, false, 4, '2026-10-09 12:04:45.705546', '2026-10-09 12:04:45.705546', 0.00);
INSERT INTO public.answer_options VALUES (36, 11, 'week', NULL, NULL, false, 1, '2026-10-09 12:04:45.839248', '2026-10-09 12:04:45.839248', 0.00);
INSERT INTO public.answer_options VALUES (37, 11, 'equipment', NULL, NULL, false, 2, '2026-10-09 12:04:45.972742', '2026-10-09 12:04:45.972742', 0.00);
INSERT INTO public.answer_options VALUES (38, 11, 'zone', NULL, NULL, true, 3, '2026-10-09 12:04:46.106013', '2026-10-09 12:04:46.106013', 0.00);
INSERT INTO public.answer_options VALUES (39, 11, 'dryness', NULL, NULL, false, 4, '2026-10-09 12:04:46.239242', '2026-10-09 12:04:46.239242', 0.00);
INSERT INTO public.answer_options VALUES (40, 12, 'Projects in dry regions are feasible because of the huge budget gained from applying smart Irrigation', NULL, NULL, false, 1, '2026-10-09 12:04:46.373149', '2026-10-09 12:04:46.373149', 0.00);
INSERT INTO public.answer_options VALUES (41, 12, 'Money saved thanks to smart irrigation maintains the economic practicality of projects in dry areas', NULL, NULL, true, 2, '2026-10-09 12:04:46.506657', '2026-10-09 12:04:46.506657', 0.00);
INSERT INTO public.answer_options VALUES (42, 12, 'Continents with dry climate are the most likely to enjoy financial benefits from smart irrigation projects', NULL, NULL, false, 3, '2026-10-09 12:04:46.643726', '2026-10-09 12:04:46.643726', 0.00);
INSERT INTO public.answer_options VALUES (43, 12, 'In places with hot weather, economic projects are possible with money saved from smart irrigation', NULL, NULL, false, 4, '2026-10-09 12:04:46.776867', '2026-10-09 12:04:46.776867', 0.00);
INSERT INTO public.answer_options VALUES (44, 13, 'With the help of analytic tools, project farmers can anticipate market demand', NULL, NULL, true, 1, '2026-10-09 12:04:46.916221', '2026-10-09 12:04:46.916221', 0.00);
INSERT INTO public.answer_options VALUES (45, 13, 'Customers tend to find the entries frozen by blockchain records untrustworthy', NULL, NULL, false, 2, '2026-10-09 12:04:47.049676', '2026-10-09 12:04:47.049676', 0.00);
INSERT INTO public.answer_options VALUES (46, 13, 'The digital trail would stop after the project partners have gathered their harvest', NULL, NULL, false, 3, '2026-10-09 12:04:47.18295', '2026-10-09 12:04:47.18295', 0.00);
INSERT INTO public.answer_options VALUES (47, 13, 'Cloud platforms allow processors to predict demand for the following seasons', NULL, NULL, false, 4, '2026-10-09 12:04:47.316318', '2026-10-09 12:04:47.316318', 0.00);
INSERT INTO public.answer_options VALUES (48, 14, 'Paragraph 1', NULL, NULL, false, 1, '2026-10-09 12:04:47.4497', '2026-10-09 12:04:47.4497', 0.00);
INSERT INTO public.answer_options VALUES (49, 14, 'Paragraph 2', NULL, NULL, false, 2, '2026-10-09 12:04:47.582824', '2026-10-09 12:04:47.582824', 0.00);
INSERT INTO public.answer_options VALUES (50, 14, 'Paragraph 4', NULL, NULL, true, 3, '2026-10-09 12:04:47.716426', '2026-10-09 12:04:47.716426', 0.00);
INSERT INTO public.answer_options VALUES (51, 14, 'Paragraph 3', NULL, NULL, false, 4, '2026-10-09 12:04:47.849768', '2026-10-09 12:04:47.849768', 0.00);
INSERT INTO public.answer_options VALUES (52, 15, 'Paragraph 4', NULL, NULL, false, 1, '2026-10-09 12:04:47.983026', '2026-10-09 12:04:47.983026', 0.00);
INSERT INTO public.answer_options VALUES (53, 15, 'Paragraph 3', NULL, NULL, false, 2, '2026-10-09 12:04:48.116337', '2026-10-09 12:04:48.116337', 0.00);
INSERT INTO public.answer_options VALUES (54, 15, 'Paragraph 2', NULL, NULL, true, 3, '2026-10-09 12:04:48.249511', '2026-10-09 12:04:48.249511', 0.00);
INSERT INTO public.answer_options VALUES (55, 15, 'Paragraph 1', NULL, NULL, false, 4, '2026-10-09 12:04:48.382825', '2026-10-09 12:04:48.382825', 0.00);
INSERT INTO public.answer_options VALUES (56, 16, 'a-b-d-e-c', NULL, NULL, false, 1, '2026-10-09 12:04:48.516622', '2026-10-09 12:04:48.516622', 0.00);
INSERT INTO public.answer_options VALUES (57, 16, 'e-d-c-a-b', NULL, NULL, false, 2, '2026-10-09 12:04:48.650331', '2026-10-09 12:04:48.650331', 0.00);
INSERT INTO public.answer_options VALUES (58, 16, 'e-c-d-b-a', NULL, NULL, true, 3, '2026-10-09 12:04:48.783818', '2026-10-09 12:04:48.783818', 0.00);
INSERT INTO public.answer_options VALUES (59, 16, 'a-d-b-c-e', NULL, NULL, false, 4, '2026-10-09 12:04:48.917161', '2026-10-09 12:04:48.917161', 0.00);
INSERT INTO public.answer_options VALUES (60, 17, 'd-a-c-b-e', NULL, NULL, true, 1, '2026-10-09 12:04:49.051701', '2026-10-09 12:04:49.051701', 0.00);
INSERT INTO public.answer_options VALUES (61, 17, 'c-a-d-b-e', NULL, NULL, false, 2, '2026-10-09 12:04:49.185207', '2026-10-09 12:04:49.185207', 0.00);
INSERT INTO public.answer_options VALUES (62, 17, 'e-a-d-b-c', NULL, NULL, false, 3, '2026-10-09 12:04:49.318492', '2026-10-09 12:04:49.318492', 0.00);
INSERT INTO public.answer_options VALUES (63, 17, 'c-b-e-a-d', NULL, NULL, false, 4, '2026-10-09 12:04:49.451482', '2026-10-09 12:04:49.451482', 0.00);
INSERT INTO public.answer_options VALUES (64, 18, 'c-a-b', NULL, NULL, false, 1, '2026-10-09 12:04:49.584526', '2026-10-09 12:04:49.584526', 0.00);
INSERT INTO public.answer_options VALUES (65, 18, 'a-b-c', NULL, NULL, false, 2, '2026-10-09 12:04:49.717701', '2026-10-09 12:04:49.717701', 0.00);
INSERT INTO public.answer_options VALUES (66, 18, 'c-b-a', NULL, NULL, true, 3, '2026-10-09 12:04:49.851462', '2026-10-09 12:04:49.851462', 0.00);
INSERT INTO public.answer_options VALUES (67, 18, 'a-c-b', NULL, NULL, false, 4, '2026-10-09 12:04:49.984818', '2026-10-09 12:04:49.984818', 0.00);
INSERT INTO public.answer_options VALUES (68, 19, 'd-b-c-e-a', NULL, NULL, true, 1, '2026-10-09 12:04:50.117982', '2026-10-09 12:04:50.117982', 0.00);
INSERT INTO public.answer_options VALUES (69, 19, 'e-c-a-b-d', NULL, NULL, false, 2, '2026-10-09 12:04:50.25146', '2026-10-09 12:04:50.25146', 0.00);
INSERT INTO public.answer_options VALUES (70, 19, 'd-e-b-a-c', NULL, NULL, false, 3, '2026-10-09 12:04:50.384683', '2026-10-09 12:04:50.384683', 0.00);
INSERT INTO public.answer_options VALUES (71, 19, 'e-a-d-c-b', NULL, NULL, false, 4, '2026-10-09 12:04:50.517703', '2026-10-09 12:04:50.517703', 0.00);
INSERT INTO public.answer_options VALUES (72, 20, 'c-e-a-b-d', NULL, NULL, false, 1, '2026-10-09 12:04:50.650783', '2026-10-09 12:04:50.650783', 0.00);
INSERT INTO public.answer_options VALUES (73, 20, 'e-d-b-c-a', NULL, NULL, true, 2, '2026-10-09 12:04:50.784307', '2026-10-09 12:04:50.784307', 0.00);
INSERT INTO public.answer_options VALUES (74, 20, 'e-a-b-d-c', NULL, NULL, false, 3, '2026-10-09 12:04:50.917719', '2026-10-09 12:04:50.917719', 0.00);
INSERT INTO public.answer_options VALUES (75, 20, 'c-e-d-a-b', NULL, NULL, false, 4, '2026-10-09 12:04:51.05117', '2026-10-09 12:04:51.05117', 0.00);
INSERT INTO public.answer_options VALUES (76, 21, 'Involves hiring an expert agency', NULL, NULL, false, 1, '2026-10-09 12:04:51.18434', '2026-10-09 12:04:51.18434', 0.00);
INSERT INTO public.answer_options VALUES (77, 21, 'is costly and demanding', NULL, NULL, true, 2, '2026-10-09 12:04:51.317579', '2026-10-09 12:04:51.317579', 0.00);
INSERT INTO public.answer_options VALUES (78, 21, 'physically injures those involved', NULL, NULL, false, 3, '2026-10-09 12:04:51.450854', '2026-10-09 12:04:51.450854', 0.00);
INSERT INTO public.answer_options VALUES (79, 21, 'is overlooked by corporations', NULL, NULL, false, 4, '2026-10-09 12:04:51.584464', '2026-10-09 12:04:51.584464', 0.00);
INSERT INTO public.answer_options VALUES (80, 22, 'The great pressure to soothe environmental claims urges high-emitting corporations to adopt greenwashing wisely', NULL, NULL, false, 1, '2026-10-09 12:04:51.717885', '2026-10-09 12:04:51.717885', 0.00);
INSERT INTO public.answer_options VALUES (81, 22, 'Large emission enterprises prefer "net-zero" or "carbon-neutral" tags on their offerings over genuine decarbonisation', NULL, NULL, true, 2, '2026-10-09 12:04:51.851112', '2026-10-09 12:04:51.851112', 0.00);
INSERT INTO public.answer_options VALUES (82, 22, 'Chief executives'' opinions are divided on whether or not genuine decarbonisation should be consistently implemented', NULL, NULL, false, 3, '2026-10-09 12:04:51.984132', '2026-10-09 12:04:51.984132', 0.00);
INSERT INTO public.answer_options VALUES (83, 22, 'The exponential growth of greenwashing is attributable to the environmental benefits the strategy brings to major emitters', NULL, NULL, false, 4, '2026-10-09 12:04:52.116906', '2026-10-09 12:04:52.116906', 0.00);
INSERT INTO public.answer_options VALUES (84, 23, 'non-degradable electronics', NULL, NULL, true, 1, '2026-10-09 12:04:52.250193', '2026-10-09 12:04:52.250193', 0.00);
INSERT INTO public.answer_options VALUES (85, 23, 'zero-impact fuel', NULL, NULL, false, 2, '2026-10-09 12:04:52.383713', '2026-10-09 12:04:52.383713', 0.00);
INSERT INTO public.answer_options VALUES (86, 23, 'guilt-free flights', NULL, NULL, false, 3, '2026-10-09 12:04:52.517089', '2026-10-09 12:04:52.517089', 0.00);
INSERT INTO public.answer_options VALUES (87, 23, 'net-zero bacon', NULL, NULL, false, 4, '2026-10-09 12:04:52.650237', '2026-10-09 12:04:52.650237', 0.00);
INSERT INTO public.answer_options VALUES (88, 24, 'costly but ineffective', NULL, NULL, false, 1, '2026-10-09 12:04:52.783416', '2026-10-09 12:04:52.783416', 0.00);
INSERT INTO public.answer_options VALUES (89, 24, 'expensive but essential', NULL, NULL, false, 2, '2026-10-09 12:04:52.917107', '2026-10-09 12:04:52.917107', 0.00);
INSERT INTO public.answer_options VALUES (90, 24, 'confusing but engaging', NULL, NULL, false, 3, '2026-10-09 12:04:53.050272', '2026-10-09 12:04:53.050272', 0.00);
INSERT INTO public.answer_options VALUES (91, 24, 'appealing but superficial', NULL, NULL, true, 4, '2026-10-09 12:04:53.183576', '2026-10-09 12:04:53.183576', 0.00);
INSERT INTO public.answer_options VALUES (92, 25, 'the United States', NULL, NULL, false, 1, '2026-10-09 12:04:53.319182', '2026-10-09 12:04:53.319182', 0.00);
INSERT INTO public.answer_options VALUES (93, 25, 'oil and gas giants', NULL, NULL, true, 2, '2026-10-09 12:04:53.452423', '2026-10-09 12:04:53.452423', 0.00);
INSERT INTO public.answer_options VALUES (94, 25, 'rules on environmental claims', NULL, NULL, false, 3, '2026-10-09 12:04:53.585485', '2026-10-09 12:04:53.585485', 0.00);
INSERT INTO public.answer_options VALUES (95, 25, 'regulators in Europe', NULL, NULL, false, 4, '2026-10-09 12:04:53.718754', '2026-10-09 12:04:53.718754', 0.00);
INSERT INTO public.answer_options VALUES (96, 26, 'Not until genuine efforts to cut down on emissions are recognised could the truth about greenwashing be concealed.', NULL, NULL, false, 1, '2026-10-09 12:04:53.852035', '2026-10-09 12:04:53.852035', 0.00);
INSERT INTO public.answer_options VALUES (97, 26, 'No sooner had empty resolutions minimised emissions than the plain truth about greenwashing was elucidated', NULL, NULL, false, 2, '2026-10-09 12:04:53.985366', '2026-10-09 12:04:53.985366', 0.00);
INSERT INTO public.answer_options VALUES (98, 26, 'Were it not for genuine efforts to reduce emissions, rhetoric about greenwashing could not be brought to light', NULL, NULL, false, 3, '2026-10-09 12:04:54.118779', '2026-10-09 12:04:54.118779', 0.00);
INSERT INTO public.answer_options VALUES (99, 26, 'Genuine efforts to reduce emissions cannot take the place of rhetoric without greenwashing being uncovered', NULL, NULL, true, 4, '2026-10-09 12:04:54.251942', '2026-10-09 12:04:54.251942', 0.00);
INSERT INTO public.answer_options VALUES (100, 27, 'a prompt response to public demand for eco-friendly products', NULL, NULL, false, 1, '2026-10-09 12:04:54.384767', '2026-10-09 12:04:54.384767', 0.00);
INSERT INTO public.answer_options VALUES (101, 27, 'a particular way to dispute the claims about environmental crisis', NULL, NULL, false, 2, '2026-10-09 12:04:54.517669', '2026-10-09 12:04:54.517669', 0.00);
INSERT INTO public.answer_options VALUES (102, 27, 'a specific example of greenwashing', NULL, NULL, true, 3, '2026-10-09 12:04:54.650991', '2026-10-09 12:04:54.650991', 0.00);
INSERT INTO public.answer_options VALUES (103, 27, 'a typical application of climate science', NULL, NULL, false, 4, '2026-10-09 12:04:54.784177', '2026-10-09 12:04:54.784177', 0.00);
INSERT INTO public.answer_options VALUES (104, 28, 'Increased public concern about environmental Issues, coupled with their complacency with "eco-friendly" labelled products, contributes to the rise of greenwashing.', NULL, NULL, true, 1, '2026-10-09 12:04:54.917147', '2026-10-09 12:04:54.917147', 0.00);
INSERT INTO public.answer_options VALUES (105, 28, 'Regulators have the necessary tools and resources to verify most environmental claims, which enables them to prevent misleading messages from reaching everyday consumers.', NULL, NULL, false, 2, '2026-10-09 12:04:55.050038', '2026-10-09 12:04:55.050038', 0.00);
INSERT INTO public.answer_options VALUES (106, 28, 'The profits that high-emitting firms reap from running a "green" marketing campaign provide them with resources to reinvest in renewable ventures.', NULL, NULL, false, 3, '2026-10-09 12:04:55.183288', '2026-10-09 12:04:55.183288', 0.00);
INSERT INTO public.answer_options VALUES (107, 28, 'The perceived action created by greenwashing has stressed the urgency for meaningful regulatory and corporate changes to address climate change.', NULL, NULL, false, 4, '2026-10-09 12:04:55.316351', '2026-10-09 12:04:55.316351', 0.00);
INSERT INTO public.answer_options VALUES (108, 29, '$\left[\begin{array}{l}II\end{array}\right.$', NULL, NULL, false, 1, '2026-10-09 12:04:55.449753', '2026-10-09 12:04:55.449753', 0.00);
INSERT INTO public.answer_options VALUES (109, 29, '$\left[\begin{array}{l}IV\end{array}\right.$', NULL, NULL, false, 2, '2026-10-09 12:04:55.583138', '2026-10-09 12:04:55.583138', 0.00);
INSERT INTO public.answer_options VALUES (110, 29, '$\left[\begin{array}{l}I\end{array}\right.$', NULL, NULL, true, 3, '2026-10-09 12:04:55.71622', '2026-10-09 12:04:55.71622', 0.00);
INSERT INTO public.answer_options VALUES (111, 29, '$\left[\begin{array}{l}III\end{array}\right.$', NULL, NULL, false, 4, '2026-10-09 12:04:55.849694', '2026-10-09 12:04:55.849694', 0.00);
INSERT INTO public.answer_options VALUES (112, 30, 'Major emitters have opted for open climate denials In preference to more sophisticated greenwashing to preserve profits and reputation Instead of reforming their core operations.', NULL, NULL, false, 1, '2026-10-09 12:04:55.983032', '2026-10-09 12:04:55.983032', 0.00);
INSERT INTO public.answer_options VALUES (113, 30, 'A new wave of greenwashing allows corporations to hide ongoing pollution behind reassuring eco-labels, diverting scrutiny from the rapid emission cuts considered vital by scientists.', NULL, NULL, true, 2, '2026-10-09 12:04:56.116061', '2026-10-09 12:04:56.116061', 0.00);
INSERT INTO public.answer_options VALUES (114, 30, 'Greenwashing has now been pervading everyday products and services, raising customers'' awareness of the urgent need to maintain sustainable developments.', NULL, NULL, false, 3, '2026-10-09 12:04:56.24924', '2026-10-09 12:04:56.24924', 0.00);
INSERT INTO public.answer_options VALUES (115, 30, 'Greenwashing has significantly grown in its scale and sophistication since its emergence, attracting considerable attention of both the general public and policymakers worldwide.', NULL, NULL, false, 4, '2026-10-09 12:04:56.382418', '2026-10-09 12:04:56.382418', 0.00);
INSERT INTO public.answer_options VALUES (116, 31, 'who', NULL, NULL, false, 1, '2026-10-09 12:04:56.5159', '2026-10-09 12:04:56.5159', 0.00);
INSERT INTO public.answer_options VALUES (117, 31, 'which', NULL, NULL, true, 2, '2026-10-09 12:04:56.649072', '2026-10-09 12:04:56.649072', 0.00);
INSERT INTO public.answer_options VALUES (118, 31, 'whom', NULL, NULL, false, 3, '2026-10-09 12:04:56.782345', '2026-10-09 12:04:56.782345', 0.00);
INSERT INTO public.answer_options VALUES (119, 31, 'whose', NULL, NULL, false, 4, '2026-10-09 12:04:56.915509', '2026-10-09 12:04:56.915509', 0.00);
INSERT INTO public.answer_options VALUES (120, 32, 'heading', NULL, NULL, false, 1, '2026-10-09 12:04:57.048592', '2026-10-09 12:04:57.048592', 0.00);
INSERT INTO public.answer_options VALUES (121, 32, 'Leading', NULL, NULL, true, 2, '2026-10-09 12:04:57.181717', '2026-10-09 12:04:57.181717', 0.00);
INSERT INTO public.answer_options VALUES (122, 32, 'flying', NULL, NULL, false, 3, '2026-10-09 12:04:57.315046', '2026-10-09 12:04:57.315046', 0.00);
INSERT INTO public.answer_options VALUES (123, 32, 'rating', NULL, NULL, false, 4, '2026-10-09 12:04:57.448446', '2026-10-09 12:04:57.448446', 0.00);
INSERT INTO public.answer_options VALUES (124, 33, 'range', NULL, NULL, true, 1, '2026-10-09 12:04:57.581569', '2026-10-09 12:04:57.581569', 0.00);
INSERT INTO public.answer_options VALUES (125, 33, 'deal', NULL, NULL, false, 2, '2026-10-09 12:04:57.714661', '2026-10-09 12:04:57.714661', 0.00);
INSERT INTO public.answer_options VALUES (126, 33, 'number', NULL, NULL, false, 3, '2026-10-09 12:04:57.847697', '2026-10-09 12:04:57.847697', 0.00);
INSERT INTO public.answer_options VALUES (127, 33, 'amount', NULL, NULL, false, 4, '2026-10-09 12:04:57.980857', '2026-10-09 12:04:57.980857', 0.00);
INSERT INTO public.answer_options VALUES (128, 34, 'have held', NULL, NULL, false, 1, '2026-10-09 12:04:58.114335', '2026-10-09 12:04:58.114335', 0.00);
INSERT INTO public.answer_options VALUES (129, 34, 'be holding', NULL, NULL, false, 2, '2026-10-09 12:04:58.247722', '2026-10-09 12:04:58.247722', 0.00);
INSERT INTO public.answer_options VALUES (130, 34, 'holding', NULL, NULL, false, 3, '2026-10-09 12:04:58.380682', '2026-10-09 12:04:58.380682', 0.00);
INSERT INTO public.answer_options VALUES (131, 34, 'held', NULL, NULL, true, 4, '2026-10-09 12:04:58.514053', '2026-10-09 12:04:58.514053', 0.00);
INSERT INTO public.answer_options VALUES (132, 35, 'collectively', NULL, NULL, false, 1, '2026-10-09 12:04:58.647874', '2026-10-09 12:04:58.647874', 0.00);
INSERT INTO public.answer_options VALUES (133, 35, 'Collect', NULL, NULL, false, 2, '2026-10-09 12:04:58.781046', '2026-10-09 12:04:58.781046', 0.00);
INSERT INTO public.answer_options VALUES (134, 35, 'collectors', NULL, NULL, true, 3, '2026-10-09 12:04:58.913973', '2026-10-09 12:04:58.913973', 0.00);
INSERT INTO public.answer_options VALUES (135, 35, 'collective', NULL, NULL, false, 4, '2026-10-09 12:04:59.047008', '2026-10-09 12:04:59.047008', 0.00);
INSERT INTO public.answer_options VALUES (136, 36, 'fill up', NULL, NULL, false, 1, '2026-10-09 12:04:59.180106', '2026-10-09 12:04:59.180106', 0.00);
INSERT INTO public.answer_options VALUES (137, 36, 'come up', NULL, NULL, false, 2, '2026-10-09 12:04:59.313428', '2026-10-09 12:04:59.313428', 0.00);
INSERT INTO public.answer_options VALUES (138, 36, 'pick up', NULL, NULL, true, 3, '2026-10-09 12:04:59.446587', '2026-10-09 12:04:59.446587', 0.00);
INSERT INTO public.answer_options VALUES (139, 36, 'get up', NULL, NULL, false, 4, '2026-10-09 12:04:59.579654', '2026-10-09 12:04:59.579654', 0.00);
INSERT INTO public.answer_options VALUES (140, 37, 'at', NULL, NULL, false, 1, '2026-10-09 12:04:59.715068', '2026-10-09 12:04:59.715068', 0.00);
INSERT INTO public.answer_options VALUES (141, 37, 'to', NULL, NULL, false, 2, '2026-10-09 12:04:59.84815', '2026-10-09 12:04:59.84815', 0.00);
INSERT INTO public.answer_options VALUES (142, 37, 'of', NULL, NULL, true, 3, '2026-10-09 12:04:59.981305', '2026-10-09 12:04:59.981305', 0.00);
INSERT INTO public.answer_options VALUES (143, 37, 'in', NULL, NULL, false, 4, '2026-10-09 12:05:00.115184', '2026-10-09 12:05:00.115184', 0.00);
INSERT INTO public.answer_options VALUES (144, 38, 'nor', NULL, NULL, false, 1, '2026-10-09 12:05:00.24886', '2026-10-09 12:05:00.24886', 0.00);
INSERT INTO public.answer_options VALUES (145, 38, 'but', NULL, NULL, false, 2, '2026-10-09 12:05:00.381816', '2026-10-09 12:05:00.381816', 0.00);
INSERT INTO public.answer_options VALUES (146, 38, 'so', NULL, NULL, false, 3, '2026-10-09 12:05:00.516281', '2026-10-09 12:05:00.516281', 0.00);
INSERT INTO public.answer_options VALUES (147, 38, 'or', NULL, NULL, true, 4, '2026-10-09 12:05:00.649303', '2026-10-09 12:05:00.649303', 0.00);
INSERT INTO public.answer_options VALUES (148, 39, 'heavy bags grocery', NULL, NULL, false, 1, '2026-10-09 12:05:00.782226', '2026-10-09 12:05:00.782226', 0.00);
INSERT INTO public.answer_options VALUES (149, 39, 'bags grocery heavy', NULL, NULL, false, 2, '2026-10-09 12:05:00.918936', '2026-10-09 12:05:00.918936', 0.00);
INSERT INTO public.answer_options VALUES (150, 39, 'bags heavy grocery', NULL, NULL, false, 3, '2026-10-09 12:05:01.052065', '2026-10-09 12:05:01.052065', 0.00);
INSERT INTO public.answer_options VALUES (151, 39, 'heavy grocery bags', NULL, NULL, true, 4, '2026-10-09 12:05:01.185042', '2026-10-09 12:05:01.185042', 0.00);
INSERT INTO public.answer_options VALUES (152, 40, 'another', NULL, NULL, false, 1, '2026-10-09 12:05:01.318175', '2026-10-09 12:05:01.318175', 0.00);
INSERT INTO public.answer_options VALUES (153, 40, 'others', NULL, NULL, false, 2, '2026-10-09 12:05:01.451339', '2026-10-09 12:05:01.451339', 0.00);
INSERT INTO public.answer_options VALUES (154, 40, 'the others', NULL, NULL, false, 3, '2026-10-09 12:05:01.584431', '2026-10-09 12:05:01.584431', 0.00);
INSERT INTO public.answer_options VALUES (155, 40, 'other', NULL, NULL, true, 4, '2026-10-09 12:05:01.717625', '2026-10-09 12:05:01.717625', 0.00);
INSERT INTO public.answer_options VALUES (156, 41, 'replacing', NULL, NULL, false, 1, '2026-10-09 12:05:01.850695', '2026-10-09 12:05:01.850695', 0.00);
INSERT INTO public.answer_options VALUES (157, 41, 'contrasting', NULL, NULL, false, 2, '2026-10-09 12:05:01.983962', '2026-10-09 12:05:01.983962', 0.00);
INSERT INTO public.answer_options VALUES (158, 41, 'engaging', NULL, NULL, true, 3, '2026-10-09 12:05:02.117027', '2026-10-09 12:05:02.117027', 0.00);
INSERT INTO public.answer_options VALUES (159, 41, 'comparing', NULL, NULL, false, 4, '2026-10-09 12:05:02.250365', '2026-10-09 12:05:02.250365', 0.00);
INSERT INTO public.answer_options VALUES (160, 42, 'values', NULL, NULL, false, 1, '2026-10-09 12:05:02.383642', '2026-10-09 12:05:02.383642', 0.00);
INSERT INTO public.answer_options VALUES (161, 42, 'legends', NULL, NULL, false, 2, '2026-10-09 12:05:02.516591', '2026-10-09 12:05:02.516591', 0.00);
INSERT INTO public.answer_options VALUES (162, 42, 'marvels', NULL, NULL, false, 3, '2026-10-09 12:05:02.649849', '2026-10-09 12:05:02.649849', 0.00);
INSERT INTO public.answer_options VALUES (163, 42, 'wonders', NULL, NULL, true, 4, '2026-10-09 12:05:02.783027', '2026-10-09 12:05:02.783027', 0.00);
INSERT INTO public.answer_options VALUES (164, 43, '64', NULL, NULL, false, 1, '2026-10-09 13:11:32.14411', '2026-10-09 13:11:32.14411', 0.00);
INSERT INTO public.answer_options VALUES (165, 43, '81', NULL, NULL, false, 2, '2026-10-09 13:11:32.293712', '2026-10-09 13:11:32.293712', 0.00);
INSERT INTO public.answer_options VALUES (166, 43, '12', NULL, NULL, true, 3, '2026-10-09 13:11:32.434648', '2026-10-09 13:11:32.434648', 0.00);
INSERT INTO public.answer_options VALUES (167, 43, '$\frac{4}{3}$', NULL, NULL, false, 4, '2026-10-09 13:11:32.578255', '2026-10-09 13:11:32.578255', 0.00);
INSERT INTO public.answer_options VALUES (168, 44, 'f(x) = 3$x^{2}$ + 2 + $\sin({}x)$', NULL, NULL, false, 1, '2026-10-09 13:11:32.719231', '2026-10-09 13:11:32.719231', 0.00);
INSERT INTO public.answer_options VALUES (169, 44, 'Hàm số đồng biến trên ( $-\pi$;  $\pi$)', NULL, NULL, true, 2, '2026-10-09 13:11:32.860231', '2026-10-09 13:11:32.860231', 0.00);
INSERT INTO public.answer_options VALUES (170, 44, 'Hàm số nghịch biến trên ( $\pi$;  2$\pi$)', NULL, NULL, false, 3, '2026-10-09 13:11:33.000909', '2026-10-09 13:11:33.000909', 0.00);
INSERT INTO public.answer_options VALUES (171, 44, 'f(2025) > f(2026)', NULL, NULL, false, 4, '2026-10-09 13:11:33.141679', '2026-10-09 13:11:33.141679', 0.00);
INSERT INTO public.answer_options VALUES (172, 45, '8', NULL, NULL, false, 1, '2026-10-09 13:11:33.28265', '2026-10-09 13:11:33.28265', 0.00);
INSERT INTO public.answer_options VALUES (173, 45, '1', NULL, NULL, true, 2, '2026-10-09 13:11:33.424171', '2026-10-09 13:11:33.424171', 0.00);
INSERT INTO public.answer_options VALUES (174, 45, '40320', NULL, NULL, false, 3, '2026-10-09 13:11:33.565166', '2026-10-09 13:11:33.565166', 0.00);
INSERT INTO public.answer_options VALUES (175, 45, '64', NULL, NULL, false, 4, '2026-10-09 13:11:33.706456', '2026-10-09 13:11:33.706456', 0.00);
INSERT INTO public.answer_options VALUES (176, 46, '90$^\circ$', NULL, NULL, false, 1, '2026-10-09 13:11:33.847054', '2026-10-09 13:11:33.847054', 0.00);
INSERT INTO public.answer_options VALUES (177, 46, '45$^\circ$', NULL, NULL, false, 2, '2026-10-09 13:11:33.988173', '2026-10-09 13:11:33.988173', 0.00);
INSERT INTO public.answer_options VALUES (178, 46, '60$^\circ$', NULL, NULL, true, 3, '2026-10-09 13:11:34.12944', '2026-10-09 13:11:34.12944', 0.00);
INSERT INTO public.answer_options VALUES (179, 46, '30$^\circ$', NULL, NULL, false, 4, '2026-10-09 13:11:34.270315', '2026-10-09 13:11:34.270315', 0.00);
INSERT INTO public.answer_options VALUES (180, 47, '4', NULL, NULL, false, 1, '2026-10-09 13:11:34.412766', '2026-10-09 13:11:34.412766', 0.00);
INSERT INTO public.answer_options VALUES (181, 47, '2', NULL, NULL, true, 2, '2026-10-09 13:11:34.554485', '2026-10-09 13:11:34.554485', 0.00);
INSERT INTO public.answer_options VALUES (182, 47, '3', NULL, NULL, false, 3, '2026-10-09 13:11:34.695471', '2026-10-09 13:11:34.695471', 0.00);
INSERT INTO public.answer_options VALUES (183, 47, '6', NULL, NULL, false, 4, '2026-10-09 13:11:34.836617', '2026-10-09 13:11:34.836617', 0.00);
INSERT INTO public.answer_options VALUES (184, 48, 'Hàm số đồng biến trên khoảng (−2; 0).', NULL, NULL, false, 1, '2026-10-09 13:11:34.978511', '2026-10-09 13:11:34.978511', 0.00);
INSERT INTO public.answer_options VALUES (185, 48, 'Hàm số đồng biến trên khoảng (−∞; 0).', NULL, NULL, false, 2, '2026-10-09 13:11:35.119175', '2026-10-09 13:11:35.119175', 0.00);
INSERT INTO public.answer_options VALUES (186, 48, 'Hàm số nghịch biến trên khoảng (0; 2).', NULL, NULL, true, 3, '2026-10-09 13:11:35.259679', '2026-10-09 13:11:35.259679', 0.00);
INSERT INTO public.answer_options VALUES (187, 48, 'Hàm số nghịch biến trên khoảng (−∞; −2).', NULL, NULL, false, 4, '2026-10-09 13:11:35.400307', '2026-10-09 13:11:35.400307', 0.00);
INSERT INTO public.answer_options VALUES (188, 49, '15', NULL, NULL, false, 1, '2026-10-09 13:11:35.540825', '2026-10-09 13:11:35.540825', 0.00);
INSERT INTO public.answer_options VALUES (189, 49, '16', NULL, NULL, true, 2, '2026-10-09 13:11:35.681946', '2026-10-09 13:11:35.681946', 0.00);
INSERT INTO public.answer_options VALUES (190, 49, '17', NULL, NULL, false, 3, '2026-10-09 13:11:35.8233', '2026-10-09 13:11:35.8233', 0.00);
INSERT INTO public.answer_options VALUES (191, 49, '18', NULL, NULL, false, 4, '2026-10-09 13:11:35.964097', '2026-10-09 13:11:35.964097', 0.00);
INSERT INTO public.answer_options VALUES (192, 50, '1', NULL, NULL, false, 1, '2026-10-09 13:11:36.105056', '2026-10-09 13:11:36.105056', 0.00);
INSERT INTO public.answer_options VALUES (193, 50, '0', NULL, NULL, false, 2, '2026-10-09 13:11:36.24586', '2026-10-09 13:11:36.24586', 0.00);
INSERT INTO public.answer_options VALUES (194, 50, '2', NULL, NULL, true, 3, '2026-10-09 13:11:36.386548', '2026-10-09 13:11:36.386548', 0.00);
INSERT INTO public.answer_options VALUES (195, 50, '$e$', NULL, NULL, false, 4, '2026-10-09 13:11:36.527459', '2026-10-09 13:11:36.527459', 0.00);
INSERT INTO public.answer_options VALUES (196, 51, '$12\sqrt2$', NULL, NULL, false, 1, '2026-10-09 13:11:36.668753', '2026-10-09 13:11:36.668753', 0.00);
INSERT INTO public.answer_options VALUES (197, 51, '13', NULL, NULL, false, 2, '2026-10-09 13:11:36.811298', '2026-10-09 13:11:36.811298', 0.00);
INSERT INTO public.answer_options VALUES (198, 51, '$5\sqrt2$', NULL, NULL, false, 3, '2026-10-09 13:11:36.952074', '2026-10-09 13:11:36.952074', 0.00);
INSERT INTO public.answer_options VALUES (199, 51, '$\frac{60}{13}$', NULL, NULL, true, 4, '2026-10-09 13:11:37.092523', '2026-10-09 13:11:37.092523', 0.00);
INSERT INTO public.answer_options VALUES (200, 52, '24', NULL, NULL, true, 1, '2026-10-09 13:11:37.233375', '2026-10-09 13:11:37.233375', 0.00);
INSERT INTO public.answer_options VALUES (201, 52, '12', NULL, NULL, false, 2, '2026-10-09 13:11:37.38118', '2026-10-09 13:11:37.38118', 0.00);
INSERT INTO public.answer_options VALUES (202, 52, '8', NULL, NULL, false, 3, '2026-10-09 13:11:37.521783', '2026-10-09 13:11:37.521783', 0.00);
INSERT INTO public.answer_options VALUES (203, 52, '6', NULL, NULL, false, 4, '2026-10-09 13:11:37.662823', '2026-10-09 13:11:37.662823', 0.00);
INSERT INTO public.answer_options VALUES (204, 53, '(-2;-1)', NULL, NULL, false, 1, '2026-10-09 13:11:37.803331', '2026-10-09 13:11:37.803331', 0.00);
INSERT INTO public.answer_options VALUES (205, 53, '(−1; 0)', NULL, NULL, false, 2, '2026-10-09 13:11:37.944382', '2026-10-09 13:11:37.944382', 0.00);
INSERT INTO public.answer_options VALUES (206, 53, '(1; 2)', NULL, NULL, false, 3, '2026-10-09 13:11:38.08559', '2026-10-09 13:11:38.08559', 0.00);
INSERT INTO public.answer_options VALUES (207, 53, '(0; +$\infty$)', NULL, NULL, true, 4, '2026-10-09 13:11:38.226158', '2026-10-09 13:11:38.226158', 0.00);
INSERT INTO public.answer_options VALUES (208, 54, '0,8', NULL, NULL, false, 1, '2026-10-09 13:11:38.367734', '2026-10-09 13:11:38.367734', 0.00);
INSERT INTO public.answer_options VALUES (209, 54, '0,9', NULL, NULL, false, 2, '2026-10-09 13:11:38.508732', '2026-10-09 13:11:38.508732', 0.00);
INSERT INTO public.answer_options VALUES (210, 54, '0,7', NULL, NULL, true, 3, '2026-10-09 13:11:38.649498', '2026-10-09 13:11:38.649498', 0.00);
INSERT INTO public.answer_options VALUES (211, 54, '0,6', NULL, NULL, false, 4, '2026-10-09 13:11:38.790333', '2026-10-09 13:11:38.790333', 0.00);
INSERT INTO public.answer_options VALUES (216, 56, '$\overrightarrow{AC}$ = $\overrightarrow{BD}$', NULL, NULL, true, 1, '2026-10-09 13:11:39.496919', '2026-10-09 13:11:39.496919', 0.12);
INSERT INTO public.answer_options VALUES (228, 65, 'x = 1', NULL, NULL, false, 1, '2026-10-10 04:15:53.113691', '2026-10-10 04:15:53.113691', 0.00);
INSERT INTO public.answer_options VALUES (229, 65, 'x = 3', NULL, NULL, false, 2, '2026-10-10 04:15:53.259013', '2026-10-10 04:15:53.259013', 0.00);
INSERT INTO public.answer_options VALUES (230, 65, 'x = −1', NULL, NULL, true, 3, '2026-10-10 04:15:53.394345', '2026-10-10 04:15:53.394345', 0.00);
INSERT INTO public.answer_options VALUES (231, 65, 'x = 2', NULL, NULL, false, 4, '2026-10-10 04:15:53.52997', '2026-10-10 04:15:53.52997', 0.00);
INSERT INTO public.answer_options VALUES (232, 66, '5', NULL, NULL, true, 1, '2026-10-10 04:15:53.665408', '2026-10-10 04:15:53.665408', 0.00);
INSERT INTO public.answer_options VALUES (233, 66, '4', NULL, NULL, false, 2, '2026-10-10 04:15:53.80122', '2026-10-10 04:15:53.80122', 0.00);
INSERT INTO public.answer_options VALUES (234, 66, '3', NULL, NULL, false, 3, '2026-10-10 04:15:53.93955', '2026-10-10 04:15:53.93955', 0.00);
INSERT INTO public.answer_options VALUES (235, 66, '2', NULL, NULL, false, 4, '2026-10-10 04:15:54.075068', '2026-10-10 04:15:54.075068', 0.00);
INSERT INTO public.answer_options VALUES (236, 67, '$2a^3$', NULL, NULL, true, 1, '2026-10-10 04:15:54.210863', '2026-10-10 04:15:54.210863', 0.00);
INSERT INTO public.answer_options VALUES (237, 67, '$3a^3$', NULL, NULL, false, 2, '2026-10-10 04:15:54.345952', '2026-10-10 04:15:54.345952', 0.00);
INSERT INTO public.answer_options VALUES (238, 67, '$6a^3$', NULL, NULL, false, 3, '2026-10-10 04:15:54.481329', '2026-10-10 04:15:54.481329', 0.00);
INSERT INTO public.answer_options VALUES (239, 67, '$a^3$', NULL, NULL, false, 4, '2026-10-10 04:15:54.616381', '2026-10-10 04:15:54.616381', 0.00);
INSERT INTO public.answer_options VALUES (240, 68, 'Hàm số nghịch biến trên khoảng (0; 2)', NULL, NULL, true, 1, '2026-10-10 04:15:54.752286', '2026-10-10 04:15:54.752286', 0.00);
INSERT INTO public.answer_options VALUES (241, 68, 'Hàm số nghịch biến trên khoảng (−$\infty$; −2)', NULL, NULL, false, 2, '2026-10-10 04:15:54.88769', '2026-10-10 04:15:54.88769', 0.00);
INSERT INTO public.answer_options VALUES (242, 68, 'Hàm số đồng biến trên khoảng (−2; 0)', NULL, NULL, false, 3, '2026-10-10 04:15:55.023216', '2026-10-10 04:15:55.023216', 0.00);
INSERT INTO public.answer_options VALUES (243, 68, 'Hàm số đồng biến trên khoảng (−$\infty$; 0)', NULL, NULL, false, 4, '2026-10-10 04:15:55.158905', '2026-10-10 04:15:55.158905', 0.00);
INSERT INTO public.answer_options VALUES (244, 69, '$x_{CD}=-1;x_{CT}=\pm3$', NULL, NULL, false, 1, '2026-10-10 04:15:55.29526', '2026-10-10 04:15:55.29526', 0.00);
INSERT INTO public.answer_options VALUES (245, 69, '$x_{CD}=5;x_{CT}=\pm3$', NULL, NULL, false, 2, '2026-10-10 04:15:55.430723', '2026-10-10 04:15:55.430723', 0.00);
INSERT INTO public.answer_options VALUES (246, 69, '$x_{CD}=1;x_{CT}=\pm2$', NULL, NULL, false, 3, '2026-10-10 04:15:55.565862', '2026-10-10 04:15:55.565862', 0.00);
INSERT INTO public.answer_options VALUES (247, 69, '$x_{CD}=0;x_{CT}=\pm\sqrt2$', NULL, NULL, true, 4, '2026-10-10 04:15:55.701365', '2026-10-10 04:15:55.701365', 0.00);
INSERT INTO public.answer_options VALUES (248, 70, 'AC $\perp$ SD', NULL, NULL, false, 1, '2026-10-10 04:15:55.836806', '2026-10-10 04:15:55.836806', 0.00);
INSERT INTO public.answer_options VALUES (249, 70, 'AC $\perp$ SB', NULL, NULL, false, 2, '2026-10-10 04:15:55.972436', '2026-10-10 04:15:55.972436', 0.00);
INSERT INTO public.answer_options VALUES (250, 70, 'AB $\perp$ SO', NULL, NULL, false, 3, '2026-10-10 04:15:56.108193', '2026-10-10 04:15:56.108193', 0.00);
INSERT INTO public.answer_options VALUES (251, 70, 'AC $\perp$ SC', NULL, NULL, true, 4, '2026-10-10 04:15:56.24367', '2026-10-10 04:15:56.24367', 0.00);
INSERT INTO public.answer_options VALUES (252, 71, '(1; 2)', NULL, NULL, true, 1, '2026-10-10 04:15:56.380241', '2026-10-10 04:15:56.380241', 0.00);
INSERT INTO public.answer_options VALUES (253, 71, '(0; 1)', NULL, NULL, false, 2, '2026-10-10 04:15:56.515277', '2026-10-10 04:15:56.515277', 0.00);
INSERT INTO public.answer_options VALUES (254, 71, '(−2; 0)', NULL, NULL, false, 3, '2026-10-10 04:15:56.65073', '2026-10-10 04:15:56.65073', 0.00);
INSERT INTO public.answer_options VALUES (255, 71, '(−1; 1)', NULL, NULL, false, 4, '2026-10-10 04:15:56.786544', '2026-10-10 04:15:56.786544', 0.00);
INSERT INTO public.answer_options VALUES (256, 72, '45$^\circ$', NULL, NULL, false, 1, '2026-10-10 04:15:56.922345', '2026-10-10 04:15:56.922345', 0.00);
INSERT INTO public.answer_options VALUES (257, 72, '60$^\circ$', NULL, NULL, true, 2, '2026-10-10 04:15:57.058099', '2026-10-10 04:15:57.058099', 0.00);
INSERT INTO public.answer_options VALUES (258, 72, '30$^\circ$', NULL, NULL, false, 3, '2026-10-10 04:15:57.194153', '2026-10-10 04:15:57.194153', 0.00);
INSERT INTO public.answer_options VALUES (259, 72, '90$^\circ$', NULL, NULL, false, 4, '2026-10-10 04:15:57.329566', '2026-10-10 04:15:57.329566', 0.00);
INSERT INTO public.answer_options VALUES (260, 73, '|$\overrightarrow{a}$| . |$\overrightarrow{b}$| . ($\overrightarrow{a}$, $\overrightarrow{b}$)', NULL, NULL, false, 1, '2026-10-10 04:15:57.465796', '2026-10-10 04:15:57.465796', 0.00);
INSERT INTO public.answer_options VALUES (261, 73, '|$\overrightarrow{a}$| . |$\overrightarrow{b}$|', NULL, NULL, false, 2, '2026-10-10 04:15:57.601451', '2026-10-10 04:15:57.601451', 0.00);
INSERT INTO public.answer_options VALUES (262, 73, '|$\overrightarrow{a}$| . |$\overrightarrow{b}$| . $\cos({}\overrightarrow{a},\overrightarrow{b})$', NULL, NULL, true, 3, '2026-10-10 04:15:57.737162', '2026-10-10 04:15:57.737162', 0.00);
INSERT INTO public.answer_options VALUES (263, 73, '|$\overrightarrow{a}$| . |$\overrightarrow{b}$| . $\sin({}\overrightarrow{a},\overrightarrow{b})$', NULL, NULL, false, 4, '2026-10-10 04:15:57.872298', '2026-10-10 04:15:57.872298', 0.00);
INSERT INTO public.answer_options VALUES (264, 74, '2', NULL, NULL, false, 1, '2026-10-10 04:15:58.007964', '2026-10-10 04:15:58.007964', 0.00);
INSERT INTO public.answer_options VALUES (265, 74, '0', NULL, NULL, false, 2, '2026-10-10 04:15:58.143382', '2026-10-10 04:15:58.143382', 0.00);
INSERT INTO public.answer_options VALUES (266, 74, '1', NULL, NULL, true, 3, '2026-10-10 04:15:58.279336', '2026-10-10 04:15:58.279336', 0.00);
INSERT INTO public.answer_options VALUES (267, 74, '3', NULL, NULL, false, 4, '2026-10-10 04:15:58.415073', '2026-10-10 04:15:58.415073', 0.00);
INSERT INTO public.answer_options VALUES (268, 75, '$4\sqrt2$', NULL, NULL, false, 1, '2026-10-10 04:15:58.55133', '2026-10-10 04:15:58.55133', 0.00);
INSERT INTO public.answer_options VALUES (269, 75, '$2\sqrt{10}$', NULL, NULL, false, 2, '2026-10-10 04:15:58.686886', '2026-10-10 04:15:58.686886', 0.00);
INSERT INTO public.answer_options VALUES (270, 75, '$\sqrt{10}$', NULL, NULL, false, 3, '2026-10-10 04:15:58.822574', '2026-10-10 04:15:58.822574', 0.00);
INSERT INTO public.answer_options VALUES (271, 75, '$4\sqrt3$', NULL, NULL, true, 4, '2026-10-10 04:15:58.958098', '2026-10-10 04:15:58.958098', 0.00);
INSERT INTO public.answer_options VALUES (272, 76, '(−1; +$\infty$)', NULL, NULL, false, 1, '2026-10-10 04:15:59.094624', '2026-10-10 04:15:59.094624', 0.00);
INSERT INTO public.answer_options VALUES (273, 76, '(1; +$\infty$)', NULL, NULL, false, 2, '2026-10-10 04:15:59.230801', '2026-10-10 04:15:59.230801', 0.00);
INSERT INTO public.answer_options VALUES (274, 76, '(-$\infty$; -1)', NULL, NULL, true, 3, '2026-10-10 04:15:59.367047', '2026-10-10 04:15:59.367047', 0.00);
INSERT INTO public.answer_options VALUES (275, 76, '(-$\infty$; 1)', NULL, NULL, false, 4, '2026-10-10 04:15:59.502311', '2026-10-10 04:15:59.502311', 0.00);
INSERT INTO public.answer_options VALUES (276, 77, 'Hàm số đã cho xác định với mọi x $\in$ R', NULL, NULL, true, 1, '2026-10-10 04:15:59.637661', '2026-10-10 04:15:59.637661', 0.24);
INSERT INTO public.answer_options VALUES (277, 77, 'Giá trị f(0) = −3$e$', NULL, NULL, false, 2, '2026-10-10 04:15:59.773003', '2026-10-10 04:15:59.773003', 0.00);
INSERT INTO public.answer_options VALUES (278, 77, 'Phương trình $f^{\prime}(x{})$ = 0 có hai nghiệm phân biệt', NULL, NULL, true, 3, '2026-10-10 04:15:59.908477', '2026-10-10 04:15:59.908477', 0.24);
INSERT INTO public.answer_options VALUES (279, 77, 'Hàm số f(x) dồng biến trên khoảng (−2; 3)', NULL, NULL, false, 4, '2026-10-10 04:16:00.043722', '2026-10-10 04:16:00.043722', 0.00);
INSERT INTO public.answer_options VALUES (280, 78, 'SH $\perp$ (ABCD).', NULL, NULL, true, 1, '2026-10-10 04:16:00.1842', '2026-10-10 04:16:00.1842', 0.24);
INSERT INTO public.answer_options VALUES (281, 78, 'Góc giữa đường thẳng SC và mặt phẳng (ABCD) là $\widehat{SCA}$', NULL, NULL, false, 2, '2026-10-10 04:16:00.320463', '2026-10-10 04:16:00.320463', 0.00);
INSERT INTO public.answer_options VALUES (282, 78, 'd(CD, SA) = 2a', NULL, NULL, true, 3, '2026-10-10 04:16:00.456186', '2026-10-10 04:16:00.456186', 0.24);
INSERT INTO public.answer_options VALUES (283, 78, '$V_{S.ABCD}=\frac{2a^3\sqrt3}{3}$', NULL, NULL, true, 4, '2026-10-10 04:16:00.591639', '2026-10-10 04:16:00.591639', 0.00);
INSERT INTO public.answer_options VALUES (284, 79, '$f^{\prime}(x{})=\frac{-x+2}{\sqrt{-x^2+4}}$', NULL, NULL, true, 1, '2026-10-10 04:16:00.727376', '2026-10-10 04:16:00.727376', 0.16);
INSERT INTO public.answer_options VALUES (285, 79, 'Hàm số nghịch biến trên (2; +$\infty$)', NULL, NULL, false, 2, '2026-10-10 04:16:00.86304', '2026-10-10 04:16:00.86304', 0.00);
INSERT INTO public.answer_options VALUES (286, 79, 'Hàm số đồng biến trên khoảng (0; 2)', NULL, NULL, true, 3, '2026-10-10 04:16:00.998609', '2026-10-10 04:16:00.998609', 0.16);
INSERT INTO public.answer_options VALUES (287, 79, 'Hàm số có 1 điểm cực trị', NULL, NULL, true, 4, '2026-10-10 04:16:01.134112', '2026-10-10 04:16:01.134112', 0.16);
INSERT INTO public.answer_options VALUES (288, 80, 'Hàm số y = f(x) có ba cực trị', NULL, NULL, false, 1, '2026-10-10 04:16:01.269622', '2026-10-10 04:16:01.269622', 0.00);
INSERT INTO public.answer_options VALUES (289, 80, 'Hàm số y = f(x) có 1 cực đại và 1 cực tiểu', NULL, NULL, true, 2, '2026-10-10 04:16:01.405335', '2026-10-10 04:16:01.405335', 0.16);
INSERT INTO public.answer_options VALUES (290, 80, 'Hàm số y = f(x) có điểm cực đại là x = 5', NULL, NULL, true, 3, '2026-10-10 04:16:01.541079', '2026-10-10 04:16:01.541079', 0.16);
INSERT INTO public.answer_options VALUES (291, 80, 'Hàm số y = f(x) có điểm cực tiểu là x = 1', NULL, NULL, true, 4, '2026-10-10 04:16:01.676889', '2026-10-10 04:16:01.676889', 0.16);
INSERT INTO public.answer_options VALUES (212, 55, 'Tại thời điểm t = 2 giây, chất điểm cách gốc tọa độ một khoảng bằng 4 m', NULL, NULL, true, 1, '2026-10-09 13:11:38.931934', '2026-10-10 04:18:21.98417', 0.16);
INSERT INTO public.answer_options VALUES (213, 55, 'Vận tốc của chất điểm tại thời điểm t = 2 giây bằng v = −2 m/s.', NULL, NULL, true, 2, '2026-10-09 13:11:39.07307', '2026-10-10 04:18:21.984204', 0.16);
INSERT INTO public.answer_options VALUES (214, 55, 'Gia tốc của chất điểm tại thời điểm t = 2 giây bằng a = 12 m/ $s^2$', NULL, NULL, true, 3, '2026-10-09 13:11:39.214563', '2026-10-10 04:18:21.984215', 0.16);
INSERT INTO public.answer_options VALUES (215, 55, 'Gia tốc nhỏ nhất của chất điểm đạt được tại thời điểm t = 1 s', NULL, NULL, false, 4, '2026-10-09 13:11:39.355664', '2026-10-10 04:18:21.984224', 0.00);
INSERT INTO public.answer_options VALUES (217, 56, '$\overrightarrow{AB^{\prime}}$ = $\overrightarrow{DC^{\prime}}$', NULL, NULL, true, 2, '2026-10-09 13:11:39.638486', '2026-10-10 04:18:21.984235', 0.12);
INSERT INTO public.answer_options VALUES (218, 56, '$\overrightarrow{AC}$ + $\overrightarrow{C^{\prime}D}$ + $\overrightarrow{CB^{\prime}}$ = 0', NULL, NULL, true, 3, '2026-10-09 13:11:39.780415', '2026-10-10 04:18:21.984243', 0.12);
INSERT INTO public.answer_options VALUES (219, 56, '| $\overrightarrow{BC}$ + $\overrightarrow{C^{\prime}D^{\prime}}$ + $\overrightarrow{BB^{\prime}}$ | = $a\sqrt3$', NULL, NULL, true, 4, '2026-10-09 13:11:39.921855', '2026-10-10 04:18:21.984252', 0.12);
INSERT INTO public.answer_options VALUES (220, 57, 'I là trung điểm AB thì SI $\perp$ (ABCD)', NULL, NULL, true, 1, '2026-10-09 13:11:40.062588', '2026-10-10 04:18:21.98426', 0.16);
INSERT INTO public.answer_options VALUES (221, 57, 'Độ dài đoạn AB = a', NULL, NULL, true, 2, '2026-10-09 13:11:40.203481', '2026-10-10 04:18:21.984269', 0.16);
INSERT INTO public.answer_options VALUES (222, 57, 'Thể tích khối chóp S.ABCD bằng $\frac{a^3\sqrt3}{4}$', NULL, NULL, true, 3, '2026-10-09 13:11:40.346083', '2026-10-10 04:18:21.984277', 0.16);
INSERT INTO public.answer_options VALUES (223, 57, 'Gọi $\alpha$ = [A, SD, C], khi đó  $\sin({}\alpha)$ = $\frac12$', NULL, NULL, false, 4, '2026-10-09 13:11:40.487069', '2026-10-10 04:18:21.984285', 0.00);
INSERT INTO public.answer_options VALUES (224, 58, 'Xác suất để số tự nhiên đó chia hết cho 10 bằng 0,1', NULL, NULL, false, 1, '2026-10-09 13:11:40.628319', '2026-10-10 04:18:21.984293', 0.00);
INSERT INTO public.answer_options VALUES (225, 58, 'Xác suất để số tự nhiên đó chia hết cho 3 bằng 0,33', NULL, NULL, true, 2, '2026-10-09 13:11:40.769583', '2026-10-10 04:18:21.984301', 0.16);
INSERT INTO public.answer_options VALUES (226, 58, 'Xác suất để số tự nhiên đó chia hết cho 3 hoặc chia hết cho 10 bằng 0,4', NULL, NULL, true, 3, '2026-10-09 13:11:40.910408', '2026-10-10 04:18:21.984532', 0.16);
INSERT INTO public.answer_options VALUES (227, 58, 'Xác suất để số tự nhiên đó chia hết cho 6 nhưng không chia hết cho 5 bằng 0,13', NULL, NULL, true, 4, '2026-10-09 13:11:41.051588', '2026-10-10 04:18:21.984542', 0.16);
INSERT INTO public.answer_options VALUES (292, 87, 'y = $x^3+x$', NULL, NULL, false, 1, '2026-10-10 05:18:58.147688', '2026-10-10 05:18:58.147688', 0.00);
INSERT INTO public.answer_options VALUES (293, 87, 'y = $-x^3-3x$', NULL, NULL, true, 2, '2026-10-10 05:18:58.283811', '2026-10-10 05:18:58.283811', 0.00);
INSERT INTO public.answer_options VALUES (294, 87, 'y = $-x^4-x^2$', NULL, NULL, false, 3, '2026-10-10 05:18:58.415348', '2026-10-10 05:18:58.415348', 0.00);
INSERT INTO public.answer_options VALUES (295, 87, 'y = $\frac{x+1}{x-3}$', NULL, NULL, false, 4, '2026-10-10 05:18:58.546377', '2026-10-10 05:18:58.546377', 0.00);
INSERT INTO public.answer_options VALUES (296, 88, '5', NULL, NULL, false, 1, '2026-10-10 05:18:58.677332', '2026-10-10 05:18:58.677332', 0.00);
INSERT INTO public.answer_options VALUES (297, 88, '-2', NULL, NULL, false, 2, '2026-10-10 05:18:58.808573', '2026-10-10 05:18:58.808573', 0.00);
INSERT INTO public.answer_options VALUES (298, 88, '3', NULL, NULL, true, 3, '2026-10-10 05:18:58.939788', '2026-10-10 05:18:58.939788', 0.00);
INSERT INTO public.answer_options VALUES (299, 88, '0', NULL, NULL, false, 4, '2026-10-10 05:18:59.070685', '2026-10-10 05:18:59.070685', 0.00);
INSERT INTO public.answer_options VALUES (300, 89, '$\left(\overrightarrow{A^{\prime}C^{\prime}},\overrightarrow{AD}\right)$ = 45$^\circ$', NULL, NULL, false, 1, '2026-10-10 05:18:59.201819', '2026-10-10 05:18:59.201819', 0.00);
INSERT INTO public.answer_options VALUES (301, 89, '$\left(\overrightarrow{A^{\prime}C^{\prime}},\overrightarrow{B^{\prime}B}}\right)$ = 90$^\circ$', NULL, NULL, false, 2, '2026-10-10 05:18:59.33426', '2026-10-10 05:18:59.33426', 0.00);
INSERT INTO public.answer_options VALUES (302, 89, '$\left(\overrightarrow{A^{\prime}A^{\prime}},\overrightarrow{CB^{\prime}}\right)$ = 45$^\circ$', NULL, NULL, true, 3, '2026-10-10 05:18:59.464957', '2026-10-10 05:18:59.464957', 0.00);
INSERT INTO public.answer_options VALUES (303, 89, '$\left(\overrightarrow{AB},\overrightarrow{CD}\right)$ = 180$^\circ$', NULL, NULL, false, 4, '2026-10-10 05:18:59.595845', '2026-10-10 05:18:59.595845', 0.00);
INSERT INTO public.answer_options VALUES (304, 90, '$\overrightarrow{BD}$', NULL, NULL, true, 1, '2026-10-10 05:18:59.729294', '2026-10-10 05:18:59.729294', 0.00);
INSERT INTO public.answer_options VALUES (305, 90, '$\overrightarrow{DB}$', NULL, NULL, false, 2, '2026-10-10 05:18:59.860273', '2026-10-10 05:18:59.860273', 0.00);
INSERT INTO public.answer_options VALUES (306, 90, '$\overrightarrow{BA}$', NULL, NULL, false, 3, '2026-10-10 05:18:59.991071', '2026-10-10 05:18:59.991071', 0.00);
INSERT INTO public.answer_options VALUES (307, 90, '$\overrightarrow{AB}$', NULL, NULL, false, 4, '2026-10-10 05:19:00.121985', '2026-10-10 05:19:00.121985', 0.00);
INSERT INTO public.answer_options VALUES (308, 91, '$\overrightarrow{a} = \overrightarrow{i}+\overrightarrow{j}+\overrightarrow{k}$', NULL, NULL, false, 1, '2026-10-10 05:19:00.252695', '2026-10-10 05:19:00.252695', 0.00);
INSERT INTO public.answer_options VALUES (309, 91, '$\overrightarrow{a} = \overrightarrow{j}+\overrightarrow{k}$', NULL, NULL, false, 2, '2026-10-10 05:19:00.383746', '2026-10-10 05:19:00.383746', 0.00);
INSERT INTO public.answer_options VALUES (310, 91, '$\overrightarrow{a} = \overrightarrow{i}+\overrightarrow{j}$', NULL, NULL, false, 3, '2026-10-10 05:19:00.519312', '2026-10-10 05:19:00.519312', 0.00);
INSERT INTO public.answer_options VALUES (311, 91, '$\overrightarrow{a} = \overrightarrow{i}+\overrightarrow{k}$', NULL, NULL, true, 4, '2026-10-10 05:19:00.650258', '2026-10-10 05:19:00.650258', 0.00);
INSERT INTO public.answer_options VALUES (312, 92, '4$\overrightarrow{SO}$', NULL, NULL, true, 1, '2026-10-10 05:19:00.781412', '2026-10-10 05:19:00.781412', 0.00);
INSERT INTO public.answer_options VALUES (313, 92, '8$\overrightarrow{SO}$', NULL, NULL, false, 2, '2026-10-10 05:19:00.912351', '2026-10-10 05:19:00.912351', 0.00);
INSERT INTO public.answer_options VALUES (314, 92, '3$\overrightarrow{SO}$', NULL, NULL, false, 3, '2026-10-10 05:19:01.04355', '2026-10-10 05:19:01.04355', 0.00);
INSERT INTO public.answer_options VALUES (315, 92, '2$\overrightarrow{SO}$', NULL, NULL, false, 4, '2026-10-10 05:19:01.174627', '2026-10-10 05:19:01.174627', 0.00);
INSERT INTO public.answer_options VALUES (316, 93, '0', NULL, NULL, false, 1, '2026-10-10 05:19:01.305245', '2026-10-10 05:19:01.305245', 0.00);
INSERT INTO public.answer_options VALUES (317, 93, '-16', NULL, NULL, true, 2, '2026-10-10 05:19:01.436394', '2026-10-10 05:19:01.436394', 0.00);
INSERT INTO public.answer_options VALUES (318, 93, '4', NULL, NULL, false, 3, '2026-10-10 05:19:01.567128', '2026-10-10 05:19:01.567128', 0.00);
INSERT INTO public.answer_options VALUES (319, 93, '20', NULL, NULL, false, 4, '2026-10-10 05:19:01.697902', '2026-10-10 05:19:01.697902', 0.00);
INSERT INTO public.answer_options VALUES (320, 94, '(1; −4)', NULL, NULL, false, 1, '2026-10-10 05:19:01.828498', '2026-10-10 05:19:01.828498', 0.00);
INSERT INTO public.answer_options VALUES (321, 94, '(0; 1; −4)', NULL, NULL, true, 2, '2026-10-10 05:19:01.959673', '2026-10-10 05:19:01.959673', 0.00);
INSERT INTO public.answer_options VALUES (322, 94, '(1; 0; −4)', NULL, NULL, false, 3, '2026-10-10 05:19:02.090832', '2026-10-10 05:19:02.090832', 0.00);
INSERT INTO public.answer_options VALUES (323, 94, '(0; −1; 4)', NULL, NULL, false, 4, '2026-10-10 05:19:02.22189', '2026-10-10 05:19:02.22189', 0.00);
INSERT INTO public.answer_options VALUES (324, 95, '1', NULL, NULL, false, 1, '2026-10-10 05:19:02.352626', '2026-10-10 05:19:02.352626', 0.00);
INSERT INTO public.answer_options VALUES (325, 95, '3', NULL, NULL, true, 2, '2026-10-10 05:19:02.483521', '2026-10-10 05:19:02.483521', 0.00);
INSERT INTO public.answer_options VALUES (326, 95, '0', NULL, NULL, false, 3, '2026-10-10 05:19:02.614569', '2026-10-10 05:19:02.614569', 0.00);
INSERT INTO public.answer_options VALUES (327, 95, '-1', NULL, NULL, false, 4, '2026-10-10 05:19:02.745279', '2026-10-10 05:19:02.745279', 0.00);
INSERT INTO public.answer_options VALUES (328, 96, '$\frac{a\sqrt3}{4}$', NULL, NULL, false, 1, '2026-10-10 05:19:02.876201', '2026-10-10 05:19:02.876201', 0.00);
INSERT INTO public.answer_options VALUES (329, 96, '$\frac{a\sqrt3}{2}$', NULL, NULL, false, 2, '2026-10-10 05:19:03.01008', '2026-10-10 05:19:03.01008', 0.00);
INSERT INTO public.answer_options VALUES (330, 96, '$2a\sqrt3$', NULL, NULL, false, 3, '2026-10-10 05:19:03.142038', '2026-10-10 05:19:03.142038', 0.00);
INSERT INTO public.answer_options VALUES (331, 96, '$a\sqrt3$', NULL, NULL, true, 4, '2026-10-10 05:19:03.272903', '2026-10-10 05:19:03.272903', 0.00);
INSERT INTO public.answer_options VALUES (332, 97, '$\overrightarrow{A^{\prime}C^{\prime}}.\overrightarrow{AC}=a^2\sqrt2$', NULL, NULL, false, 1, '2026-10-10 05:19:03.403666', '2026-10-10 05:19:03.403666', 0.00);
INSERT INTO public.answer_options VALUES (333, 97, '$\overrightarrow{A^{\prime}C^{\prime}}.\overrightarrow{AC}=a^2$', NULL, NULL, false, 2, '2026-10-10 05:19:03.534287', '2026-10-10 05:19:03.534287', 0.00);
INSERT INTO public.answer_options VALUES (334, 97, '$\overrightarrow{A^{\prime}C^{\prime}}.\overrightarrow{AC}=0$', NULL, NULL, false, 3, '2026-10-10 05:19:03.664946', '2026-10-10 05:19:03.664946', 0.00);
INSERT INTO public.answer_options VALUES (335, 97, '$\overrightarrow{A^{\prime}C^{\prime}}.\overrightarrow{AC}=2a^2$', NULL, NULL, true, 4, '2026-10-10 05:19:03.796603', '2026-10-10 05:19:03.796603', 0.00);
INSERT INTO public.answer_options VALUES (336, 98, '(1; +$\infty$)', NULL, NULL, false, 1, '2026-10-10 05:19:03.928206', '2026-10-10 05:19:03.928206', 0.00);
INSERT INTO public.answer_options VALUES (337, 98, '(−2; 0)', NULL, NULL, true, 2, '2026-10-10 05:19:04.059411', '2026-10-10 05:19:04.059411', 0.00);
INSERT INTO public.answer_options VALUES (338, 98, '(−$\infty$; −2)', NULL, NULL, false, 3, '2026-10-10 05:19:04.190234', '2026-10-10 05:19:04.190234', 0.00);
INSERT INTO public.answer_options VALUES (339, 98, '(−3; 1)', NULL, NULL, false, 4, '2026-10-10 05:19:04.320942', '2026-10-10 05:19:04.320942', 0.00);
INSERT INTO public.answer_options VALUES (340, 99, '$f^{\prime}({}-1)=0$', NULL, NULL, true, 1, '2026-10-10 05:19:04.452623', '2026-10-10 05:19:04.452623', 0.24);
INSERT INTO public.answer_options VALUES (341, 99, 'Hàm số y = f(x) đồng biến trên (1; +$\infty$)', NULL, NULL, false, 2, '2026-10-10 05:19:04.583691', '2026-10-10 05:19:04.583691', 0.00);
INSERT INTO public.answer_options VALUES (342, 99, 'Hàm số y = f(x) nghịch biến trên khoảng (−1; 3)', NULL, NULL, true, 3, '2026-10-10 05:19:04.714515', '2026-10-10 05:19:04.714515', 0.24);
INSERT INTO public.answer_options VALUES (343, 99, 'Hàm số y = f(x) đạt cực tiểu tại x = 1', NULL, NULL, false, 4, '2026-10-10 05:19:04.845254', '2026-10-10 05:19:04.845254', 0.00);
INSERT INTO public.answer_options VALUES (344, 100, '$2\overrightarrow{AB}-\overrightarrow{CD}=2\overrightarrow{AC}-\overrightarrow{BD}$', NULL, NULL, false, 1, '2026-10-10 05:19:04.976812', '2026-10-10 05:19:04.976812', 0.00);
INSERT INTO public.answer_options VALUES (345, 100, '$\overrightarrow{AB}+\overrightarrow{CD}=\overrightarrow{AD}+\overrightarrow{CB}$', NULL, NULL, true, 2, '2026-10-10 05:19:05.107708', '2026-10-10 05:19:05.107708', 0.00);
INSERT INTO public.answer_options VALUES (346, 100, '$\overrightarrow{AB}+\overrightarrow{DC}=2\overrightarrow{MN}$', NULL, NULL, true, 3, '2026-10-10 05:19:05.239337', '2026-10-10 05:19:05.239337', 0.00);
INSERT INTO public.answer_options VALUES (347, 100, '$\overrightarrow{IA}+\overrightarrow{IB}+\overrightarrow{IC}+\overrightarrow{ID}=\overrightarrow{0}$', NULL, NULL, true, 4, '2026-10-10 05:19:05.370421', '2026-10-10 05:19:05.370421', 0.00);
INSERT INTO public.answer_options VALUES (348, 101, 'Hàm số y = f(x) nghịch biến trên khoảng (−2; 2)', NULL, NULL, false, 1, '2026-10-10 05:19:05.501561', '2026-10-10 05:19:05.501561', 0.00);
INSERT INTO public.answer_options VALUES (349, 101, 'Hàm số y = f(x) đồng biến trên khoảng (3; +$\infty$)', NULL, NULL, true, 2, '2026-10-10 05:19:05.633581', '2026-10-10 05:19:05.633581', 0.00);
INSERT INTO public.answer_options VALUES (350, 101, 'Hàm số y = f(x) có hai điểm cực trị', NULL, NULL, true, 3, '2026-10-10 05:19:05.765023', '2026-10-10 05:19:05.765023', 0.00);
INSERT INTO public.answer_options VALUES (351, 101, 'Tọa độ điểm cực đại của đồ thị hàm số y = f(x) là (−2; −4)', NULL, NULL, true, 4, '2026-10-10 05:19:05.89622', '2026-10-10 05:19:05.89622', 0.00);
INSERT INTO public.answer_options VALUES (352, 102, '$\overrightarrow{AC^{\prime}}=\overrightarrow{AB}+\overrightarrow{AC}+\overrightarrow{AA^{\prime}}$', NULL, NULL, false, 1, '2026-10-10 05:19:06.027373', '2026-10-10 05:19:06.027373', 0.00);
INSERT INTO public.answer_options VALUES (353, 102, 'AC'' = $\sqrt3$', NULL, NULL, true, 2, '2026-10-10 05:19:06.158531', '2026-10-10 05:19:06.158531', 0.24);
INSERT INTO public.answer_options VALUES (354, 102, '$\cos({}\overrightarrow{BD^{\prime}},\overrightarrow{AC^{\prime}})=\frac{\sqrt{15}}{10}$', NULL, NULL, true, 3, '2026-10-10 05:19:06.289733', '2026-10-10 05:19:06.289733', 0.24);
INSERT INTO public.answer_options VALUES (355, 102, 'GM = $\frac{\sqrt{30}}{3}$', NULL, NULL, false, 4, '2026-10-10 05:19:06.422081', '2026-10-10 05:19:06.422081', 0.00);
INSERT INTO public.answer_options VALUES (356, 109, '$P(AB)$ = $P(A)$ . $P(B)$', NULL, NULL, false, 1, '2026-10-10 09:12:32.234967', '2026-10-10 09:12:32.234967', 0.00);
INSERT INTO public.answer_options VALUES (357, 109, '$P(A\cup B)$ = $P(A)$ + $P(B)$', NULL, NULL, false, 2, '2026-10-10 09:12:32.387047', '2026-10-10 09:12:32.387047', 0.00);
INSERT INTO public.answer_options VALUES (358, 109, '$P(A\cup B)$ = $P(A)$ + $P(B)$ - $P(AB)$', NULL, NULL, true, 3, '2026-10-10 09:12:32.524724', '2026-10-10 09:12:32.524724', 0.00);
INSERT INTO public.answer_options VALUES (359, 109, '$P(A\cup B)$ = $P(A)$ + $P(B)$ + $P(AB)$', NULL, NULL, false, 4, '2026-10-10 09:12:32.661292', '2026-10-10 09:12:32.661292', 0.00);
INSERT INTO public.answer_options VALUES (360, 110, 'MN $\parallel$ (SBC)', NULL, NULL, false, 1, '2026-10-10 09:12:32.798125', '2026-10-10 09:12:32.798125', 0.00);
INSERT INTO public.answer_options VALUES (361, 110, 'MN $\parallel$ (SAB)', NULL, NULL, false, 2, '2026-10-10 09:12:32.934843', '2026-10-10 09:12:32.934843', 0.00);
INSERT INTO public.answer_options VALUES (362, 110, 'MN $\parallel$ (SCD)', NULL, NULL, false, 3, '2026-10-10 09:12:33.071886', '2026-10-10 09:12:33.071886', 0.00);
INSERT INTO public.answer_options VALUES (363, 110, 'MN $\parallel$ (ABCD)', NULL, NULL, true, 4, '2026-10-10 09:12:33.209467', '2026-10-10 09:12:33.209467', 0.00);
INSERT INTO public.answer_options VALUES (364, 111, '26', NULL, NULL, false, 1, '2026-10-10 09:12:33.371753', '2026-10-10 09:12:33.371753', 0.00);
INSERT INTO public.answer_options VALUES (365, 111, '15', NULL, NULL, false, 2, '2026-10-10 09:12:33.509502', '2026-10-10 09:12:33.509502', 0.00);
INSERT INTO public.answer_options VALUES (366, 111, '20', NULL, NULL, false, 3, '2026-10-10 09:12:33.646471', '2026-10-10 09:12:33.646471', 0.00);
INSERT INTO public.answer_options VALUES (367, 111, '12', NULL, NULL, true, 4, '2026-10-10 09:12:33.81581', '2026-10-10 09:12:33.81581', 0.00);
INSERT INTO public.answer_options VALUES (368, 112, '$\overrightarrow{GM}+\overrightarrow{GN}=\overrightarrow{0}$', NULL, NULL, false, 1, '2026-10-10 09:12:33.955225', '2026-10-10 09:12:33.955225', 0.00);
INSERT INTO public.answer_options VALUES (369, 112, '$\overrightarrow{GB}+\overrightarrow{GC} + \overrightarrow{GD} =\overrightarrow{0}$', NULL, NULL, true, 2, '2026-10-10 09:12:34.092025', '2026-10-10 09:12:34.092025', 0.00);
INSERT INTO public.answer_options VALUES (370, 112, '$\overrightarrow{GA}+\overrightarrow{GB}=\overrightarrow{0}$', NULL, NULL, false, 3, '2026-10-10 09:12:34.228815', '2026-10-10 09:12:34.228815', 0.00);
INSERT INTO public.answer_options VALUES (371, 112, '$\overrightarrow{GA}+\overrightarrow{GB} + \overrightarrow{GC} =\overrightarrow{0}$', NULL, NULL, false, 4, '2026-10-10 09:12:34.370358', '2026-10-10 09:12:34.370358', 0.00);
INSERT INTO public.answer_options VALUES (372, 113, '10119', NULL, NULL, true, 1, '2026-10-10 09:12:34.506844', '2026-10-10 09:12:34.506844', 0.00);
INSERT INTO public.answer_options VALUES (373, 113, '10124', NULL, NULL, false, 2, '2026-10-10 09:12:34.643106', '2026-10-10 09:12:34.643106', 0.00);
INSERT INTO public.answer_options VALUES (374, 113, '8099', NULL, NULL, false, 3, '2026-10-10 09:12:34.779488', '2026-10-10 09:12:34.779488', 0.00);
INSERT INTO public.answer_options VALUES (375, 113, '8095', NULL, NULL, false, 4, '2026-10-10 09:12:34.916017', '2026-10-10 09:12:34.916017', 0.00);
INSERT INTO public.answer_options VALUES (376, 114, '6', NULL, NULL, false, 1, '2026-10-10 09:12:35.052649', '2026-10-10 09:12:35.052649', 0.00);
INSERT INTO public.answer_options VALUES (377, 114, '3', NULL, NULL, false, 2, '2026-10-10 09:12:35.189284', '2026-10-10 09:12:35.189284', 0.00);
INSERT INTO public.answer_options VALUES (378, 114, '5', NULL, NULL, false, 3, '2026-10-10 09:12:35.325758', '2026-10-10 09:12:35.325758', 0.00);
INSERT INTO public.answer_options VALUES (379, 114, '4', NULL, NULL, true, 4, '2026-10-10 09:12:35.462578', '2026-10-10 09:12:35.462578', 0.00);
INSERT INTO public.answer_options VALUES (380, 115, '{4}', NULL, NULL, false, 1, '2026-10-10 09:12:35.599181', '2026-10-10 09:12:35.599181', 0.00);
INSERT INTO public.answer_options VALUES (381, 115, '{1;-4}', NULL, NULL, false, 2, '2026-10-10 09:12:35.735976', '2026-10-10 09:12:35.735976', 0.00);
INSERT INTO public.answer_options VALUES (382, 115, '{$\frac{3-2\sqrt2}{2};\frac{3+2\sqrt2}{2}$}', NULL, NULL, false, 3, '2026-10-10 09:12:35.873122', '2026-10-10 09:12:35.873122', 0.00);
INSERT INTO public.answer_options VALUES (383, 115, '{-1;4}', NULL, NULL, true, 4, '2026-10-10 09:12:36.009643', '2026-10-10 09:12:36.009643', 0.00);
INSERT INTO public.answer_options VALUES (384, 116, 'Hàm số đã cho đồng x biến trên các khoảng $\left(-\infty;-\frac12\right)$ và $\left(3;+\infty\right)$', NULL, NULL, false, 1, '2026-10-10 09:12:36.146384', '2026-10-10 09:12:36.146384', 0.00);
INSERT INTO public.answer_options VALUES (385, 116, 'Hàm số đã cho đồng biến trên khoảng $\left(-\frac12;+\infty\right)$', NULL, NULL, false, 2, '2026-10-10 09:12:36.282952', '2026-10-10 09:12:36.282952', 0.00);
INSERT INTO public.answer_options VALUES (386, 116, 'Hàm số đã cho nghịch biến trên khoảng $\left(3;+\infty\right)$', NULL, NULL, true, 3, '2026-10-10 09:12:36.419476', '2026-10-10 09:12:36.419476', 0.00);
INSERT INTO public.answer_options VALUES (387, 116, 'Hàm số đã cho đồng biến trên khoảng $\left(-\infty;3\right)$', NULL, NULL, false, 4, '2026-10-10 09:12:36.555687', '2026-10-10 09:12:36.555687', 0.00);
INSERT INTO public.answer_options VALUES (388, 117, 'M (2; 0; 0)', NULL, NULL, false, 1, '2026-10-10 09:12:36.691938', '2026-10-10 09:12:36.691938', 0.00);
INSERT INTO public.answer_options VALUES (389, 117, 'N (0; −3; 1)', NULL, NULL, false, 2, '2026-10-10 09:12:36.828243', '2026-10-10 09:12:36.828243', 0.00);
INSERT INTO public.answer_options VALUES (390, 117, 'P (0; 3; −1)', NULL, NULL, true, 3, '2026-10-10 09:12:36.964678', '2026-10-10 09:12:36.964678', 0.00);
INSERT INTO public.answer_options VALUES (391, 117, 'Q (−2; 3; −1)', NULL, NULL, false, 4, '2026-10-10 09:12:37.101109', '2026-10-10 09:12:37.101109', 0.00);
INSERT INTO public.answer_options VALUES (392, 118, '$\overrightarrow{a}$ = (4; 1; −1)', NULL, NULL, false, 1, '2026-10-10 09:12:37.237233', '2026-10-10 09:12:37.237233', 0.00);
INSERT INTO public.answer_options VALUES (393, 118, '$\overrightarrow{a}$ = (3; 1; −4)', NULL, NULL, false, 2, '2026-10-10 09:12:37.374365', '2026-10-10 09:12:37.374365', 0.00);
INSERT INTO public.answer_options VALUES (394, 118, '$\overrightarrow{a}$ = (0; 1; −1)', NULL, NULL, false, 3, '2026-10-10 09:12:37.516526', '2026-10-10 09:12:37.516526', 0.00);
INSERT INTO public.answer_options VALUES (395, 118, '$\overrightarrow{a}$ = (4; 1; −5)', NULL, NULL, true, 4, '2026-10-10 09:12:37.657065', '2026-10-10 09:12:37.657065', 0.00);
INSERT INTO public.answer_options VALUES (396, 119, '3', NULL, NULL, true, 1, '2026-10-10 09:12:37.793695', '2026-10-10 09:12:37.793695', 0.00);
INSERT INTO public.answer_options VALUES (397, 119, '4', NULL, NULL, false, 2, '2026-10-10 09:12:37.930315', '2026-10-10 09:12:37.930315', 0.00);
INSERT INTO public.answer_options VALUES (398, 119, '5', NULL, NULL, false, 3, '2026-10-10 09:12:38.066678', '2026-10-10 09:12:38.066678', 0.00);
INSERT INTO public.answer_options VALUES (399, 119, '2', NULL, NULL, false, 4, '2026-10-10 09:12:38.203312', '2026-10-10 09:12:38.203312', 0.00);
INSERT INTO public.answer_options VALUES (400, 120, '3', NULL, NULL, false, 1, '2026-10-10 09:12:38.339572', '2026-10-10 09:12:38.339572', 0.00);
INSERT INTO public.answer_options VALUES (401, 120, '2', NULL, NULL, true, 2, '2026-10-10 09:12:38.476834', '2026-10-10 09:12:38.476834', 0.00);
INSERT INTO public.answer_options VALUES (402, 120, '1', NULL, NULL, false, 3, '2026-10-10 09:12:38.613277', '2026-10-10 09:12:38.613277', 0.00);
INSERT INTO public.answer_options VALUES (403, 120, '4', NULL, NULL, false, 4, '2026-10-10 09:12:38.749965', '2026-10-10 09:12:38.749965', 0.00);
INSERT INTO public.answer_options VALUES (404, 121, 'Trung bình cộng của $x_2$, $x_3$,$x_4$, $x_5$ = Trung bình cộng của $x_1$, $x_2$, ..., $x_6$', NULL, NULL, false, 1, '2026-10-10 09:12:38.886401', '2026-10-10 09:12:38.886401', 0.00);
INSERT INTO public.answer_options VALUES (405, 121, 'Trung vị của $x_2$, $x_3$,$x_4$, $x_5$ = Trung vị của $x_1$, $x_2$, ..., $x_6$', NULL, NULL, true, 2, '2026-10-10 09:12:39.024436', '2026-10-10 09:12:39.024436', 0.24);
INSERT INTO public.answer_options VALUES (406, 121, 'Độ lệch chuẩn của $x_2$, $x_3$,$x_4$, $x_5$ $\geq$ Độ lệch chuẩn của $x_1$, $x_2$, ..., $x_6$', NULL, NULL, false, 3, '2026-10-10 09:12:39.161005', '2026-10-10 09:12:39.161005', 0.00);
INSERT INTO public.answer_options VALUES (407, 121, 'Khoảng biến thiên của $x_2$, $x_3$,$x_4$, $x_5$ $\leq$ Khoảng biến thiên của $x_1$, $x_2$, ..., $x_6$', NULL, NULL, true, 4, '2026-10-10 09:12:39.297528', '2026-10-10 09:12:39.297528', 0.24);
INSERT INTO public.answer_options VALUES (408, 122, '$f(0) = 2$; $f\left(\frac{\pi}{2}\right)=\frac{\pi}{2}$', NULL, NULL, true, 1, '2026-10-10 09:12:39.438583', '2026-10-10 09:12:39.438583', 0.16);
INSERT INTO public.answer_options VALUES (409, 122, 'Đạo hàm của hàm số đã cho là $f^{\prime}({}x)=2\sin x+1$', NULL, NULL, false, 2, '2026-10-10 09:12:39.576621', '2026-10-10 09:12:39.576621', 0.00);
INSERT INTO public.answer_options VALUES (410, 122, 'Nghiệm của phương trình $f^{\prime}({}x)=0$ trên đoạn $\left[\begin{array}{l}0;\frac{\pi}{2}\end{array}\right\rbrack$ là $\frac{\pi}{6}$', NULL, NULL, true, 3, '2026-10-10 09:12:39.713313', '2026-10-10 09:12:39.713313', 0.16);
INSERT INTO public.answer_options VALUES (411, 122, 'Giá trị lớn nhất của $f\left(x\right)$ trên đoạn $\left[\begin{array}{l}0;\frac{\pi}{2}\end{array}\right\rbrack$ là $\sqrt3+\frac{\pi}{6}$', NULL, NULL, true, 4, '2026-10-10 09:12:39.849962', '2026-10-10 09:12:39.849962', 0.16);
INSERT INTO public.answer_options VALUES (412, 123, '$p_1 \geq p_2$', NULL, NULL, true, 1, '2026-10-10 09:12:39.986339', '2026-10-10 09:12:39.986339', 0.16);
INSERT INTO public.answer_options VALUES (413, 123, '$p_2 > 10p_3$', NULL, NULL, false, 2, '2026-10-10 09:12:40.122741', '2026-10-10 09:12:40.122741', 0.00);
INSERT INTO public.answer_options VALUES (414, 123, '$p_3 = 100p_0$', NULL, NULL, true, 3, '2026-10-10 09:12:40.25932', '2026-10-10 09:12:40.25932', 0.16);
INSERT INTO public.answer_options VALUES (415, 123, '$p_1 \leq 100p_2$', NULL, NULL, true, 4, '2026-10-10 09:12:40.395928', '2026-10-10 09:12:40.395928', 0.16);
INSERT INTO public.answer_options VALUES (416, 124, 'Hàm số P(t) luôn dương với mọi giá trị của t.', NULL, NULL, true, 1, '2026-10-10 09:12:40.532356', '2026-10-10 09:12:40.532356', 0.16);
INSERT INTO public.answer_options VALUES (417, 124, 'Khi t = 0, dân số P(t) = $\frac{K}{1+A}$', NULL, NULL, true, 2, '2026-10-10 09:12:40.670888', '2026-10-10 09:12:40.670888', 0.16);
INSERT INTO public.answer_options VALUES (418, 124, 'Khi t = $\frac{\ln{}A}{r}$ dân số đạt một nửa sức chứa của môi trường.', NULL, NULL, true, 3, '2026-10-10 09:12:40.807576', '2026-10-10 09:12:40.807576', 0.16);
INSERT INTO public.answer_options VALUES (419, 124, 'Mô hình này cho thấy dân số sẽ tăng mãi không giới hạn theo thời gian', NULL, NULL, false, 4, '2026-10-10 09:12:40.944943', '2026-10-10 09:12:40.944943', 0.00);


--
-- TOC entry 4290 (class 0 OID 18718)
-- Dependencies: 423
-- Data for Name: answers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.answers VALUES (3, 3, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:36.407619', '2026-10-09 12:04:36.407619', 'PER_ANSWER');
INSERT INTO public.answers VALUES (4, 3, 'SINGLE_CHOICE', NULL, NULL, NULL, 2, 0.25, NULL, NULL, false, '2026-10-09 12:04:36.553936', '2026-10-09 12:04:36.553936', 'PER_ANSWER');
INSERT INTO public.answers VALUES (5, 3, 'SINGLE_CHOICE', NULL, NULL, NULL, 3, 0.25, NULL, NULL, false, '2026-10-09 12:04:36.682516', '2026-10-09 12:04:36.682516', 'PER_ANSWER');
INSERT INTO public.answers VALUES (6, 3, 'SINGLE_CHOICE', NULL, NULL, NULL, 4, 0.25, NULL, NULL, false, '2026-10-09 12:04:36.814383', '2026-10-09 12:04:36.814383', 'PER_ANSWER');
INSERT INTO public.answers VALUES (7, 3, 'SINGLE_CHOICE', NULL, NULL, NULL, 5, 0.25, NULL, NULL, false, '2026-10-09 12:04:36.942654', '2026-10-09 12:04:36.942654', 'PER_ANSWER');
INSERT INTO public.answers VALUES (8, 4, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.071799', '2026-10-09 12:04:37.071799', 'PER_ANSWER');
INSERT INTO public.answers VALUES (9, 5, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.205896', '2026-10-09 12:04:37.205896', 'PER_ANSWER');
INSERT INTO public.answers VALUES (10, 6, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.334324', '2026-10-09 12:04:37.334324', 'PER_ANSWER');
INSERT INTO public.answers VALUES (11, 7, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.462415', '2026-10-09 12:04:37.462415', 'PER_ANSWER');
INSERT INTO public.answers VALUES (12, 8, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.590546', '2026-10-09 12:04:37.590546', 'PER_ANSWER');
INSERT INTO public.answers VALUES (13, 9, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.718885', '2026-10-09 12:04:37.718885', 'PER_ANSWER');
INSERT INTO public.answers VALUES (14, 10, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.846994', '2026-10-09 12:04:37.846994', 'PER_ANSWER');
INSERT INTO public.answers VALUES (15, 11, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:37.975552', '2026-10-09 12:04:37.975552', 'PER_ANSWER');
INSERT INTO public.answers VALUES (16, 12, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:38.103615', '2026-10-09 12:04:38.103615', 'PER_ANSWER');
INSERT INTO public.answers VALUES (17, 13, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:38.231888', '2026-10-09 12:04:38.231888', 'PER_ANSWER');
INSERT INTO public.answers VALUES (18, 14, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:38.359854', '2026-10-09 12:04:38.359854', 'PER_ANSWER');
INSERT INTO public.answers VALUES (19, 15, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:38.487828', '2026-10-09 12:04:38.487828', 'PER_ANSWER');
INSERT INTO public.answers VALUES (20, 16, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:38.615949', '2026-10-09 12:04:38.615949', 'PER_ANSWER');
INSERT INTO public.answers VALUES (21, 17, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:38.74494', '2026-10-09 12:04:38.74494', 'PER_ANSWER');
INSERT INTO public.answers VALUES (22, 18, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:38.873756', '2026-10-09 12:04:38.873756', 'PER_ANSWER');
INSERT INTO public.answers VALUES (23, 19, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.00241', '2026-10-09 12:04:39.00241', 'PER_ANSWER');
INSERT INTO public.answers VALUES (24, 20, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.130477', '2026-10-09 12:04:39.130477', 'PER_ANSWER');
INSERT INTO public.answers VALUES (25, 21, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.258242', '2026-10-09 12:04:39.258242', 'PER_ANSWER');
INSERT INTO public.answers VALUES (26, 22, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.386133', '2026-10-09 12:04:39.386133', 'PER_ANSWER');
INSERT INTO public.answers VALUES (27, 23, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.514036', '2026-10-09 12:04:39.514036', 'PER_ANSWER');
INSERT INTO public.answers VALUES (28, 24, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.64194', '2026-10-09 12:04:39.64194', 'PER_ANSWER');
INSERT INTO public.answers VALUES (29, 25, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.771334', '2026-10-09 12:04:39.771334', 'PER_ANSWER');
INSERT INTO public.answers VALUES (30, 26, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.25, NULL, NULL, false, '2026-10-09 12:04:39.899412', '2026-10-09 12:04:39.899412', 'PER_ANSWER');
INSERT INTO public.answers VALUES (31, 27, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.26, NULL, NULL, false, '2026-10-09 12:04:40.028132', '2026-10-09 12:04:40.028132', 'PER_ANSWER');
INSERT INTO public.answers VALUES (32, 27, 'SINGLE_CHOICE', NULL, NULL, NULL, 2, 0.26, NULL, NULL, false, '2026-10-09 12:04:40.155955', '2026-10-09 12:04:40.155955', 'PER_ANSWER');
INSERT INTO public.answers VALUES (33, 27, 'SINGLE_CHOICE', NULL, NULL, NULL, 3, 0.25, NULL, NULL, false, '2026-10-09 12:04:40.283973', '2026-10-09 12:04:40.283973', 'PER_ANSWER');
INSERT INTO public.answers VALUES (34, 27, 'SINGLE_CHOICE', NULL, NULL, NULL, 4, 0.25, NULL, NULL, false, '2026-10-09 12:04:40.412344', '2026-10-09 12:04:40.412344', 'PER_ANSWER');
INSERT INTO public.answers VALUES (35, 27, 'SINGLE_CHOICE', NULL, NULL, NULL, 5, 0.24, NULL, NULL, false, '2026-10-09 12:04:40.540489', '2026-10-09 12:04:40.540489', 'PER_ANSWER');
INSERT INTO public.answers VALUES (36, 27, 'SINGLE_CHOICE', NULL, NULL, NULL, 6, 0.24, NULL, NULL, false, '2026-10-09 12:04:40.671047', '2026-10-09 12:04:40.671047', 'PER_ANSWER');
INSERT INTO public.answers VALUES (37, 28, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.26, NULL, NULL, false, '2026-10-09 12:04:40.798887', '2026-10-09 12:04:40.798887', 'PER_ANSWER');
INSERT INTO public.answers VALUES (38, 28, 'SINGLE_CHOICE', NULL, NULL, NULL, 2, 0.26, NULL, NULL, false, '2026-10-09 12:04:40.926712', '2026-10-09 12:04:40.926712', 'PER_ANSWER');
INSERT INTO public.answers VALUES (39, 28, 'SINGLE_CHOICE', NULL, NULL, NULL, 3, 0.25, NULL, NULL, false, '2026-10-09 12:04:41.054511', '2026-10-09 12:04:41.054511', 'PER_ANSWER');
INSERT INTO public.answers VALUES (40, 28, 'SINGLE_CHOICE', NULL, NULL, NULL, 4, 0.25, NULL, NULL, false, '2026-10-09 12:04:41.182669', '2026-10-09 12:04:41.182669', 'PER_ANSWER');
INSERT INTO public.answers VALUES (41, 28, 'SINGLE_CHOICE', NULL, NULL, NULL, 5, 0.24, NULL, NULL, false, '2026-10-09 12:04:41.3113', '2026-10-09 12:04:41.3113', 'PER_ANSWER');
INSERT INTO public.answers VALUES (42, 28, 'SINGLE_CHOICE', NULL, NULL, NULL, 6, 0.24, NULL, NULL, false, '2026-10-09 12:04:41.439197', '2026-10-09 12:04:41.439197', 'PER_ANSWER');
INSERT INTO public.answers VALUES (46, 32, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:29.455788', '2026-10-09 13:11:29.455788', 'PER_ANSWER');
INSERT INTO public.answers VALUES (47, 33, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:29.596985', '2026-10-09 13:11:29.596985', 'PER_ANSWER');
INSERT INTO public.answers VALUES (48, 34, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:29.737848', '2026-10-09 13:11:29.737848', 'PER_ANSWER');
INSERT INTO public.answers VALUES (49, 35, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:29.878668', '2026-10-09 13:11:29.878668', 'PER_ANSWER');
INSERT INTO public.answers VALUES (50, 36, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:30.019966', '2026-10-09 13:11:30.019966', 'PER_ANSWER');
INSERT INTO public.answers VALUES (54, 40, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:30.586977', '2026-10-09 13:11:30.586977', 'PER_ANSWER');
INSERT INTO public.answers VALUES (59, 45, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '9', NULL, false, '2026-10-09 13:11:31.295756', '2026-10-09 13:11:31.295756', 'PER_ANSWER');
INSERT INTO public.answers VALUES (60, 46, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '0,33', NULL, false, '2026-10-09 13:11:31.436589', '2026-10-09 13:11:31.436589', 'PER_ANSWER');
INSERT INTO public.answers VALUES (61, 47, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '0,17', NULL, false, '2026-10-09 13:11:31.5781', '2026-10-09 13:11:31.5781', 'PER_ANSWER');
INSERT INTO public.answers VALUES (62, 48, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '0,16', NULL, false, '2026-10-09 13:11:31.718843', '2026-10-09 13:11:31.718843', 'PER_ANSWER');
INSERT INTO public.answers VALUES (65, 51, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-10 04:15:50.110368', '2026-10-10 04:15:50.110368', 'PER_ANSWER');
INSERT INTO public.answers VALUES (66, 52, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-10 04:15:50.256698', '2026-10-10 04:15:50.256698', 'PER_ANSWER');
INSERT INTO public.answers VALUES (67, 53, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:50.392699', '2026-10-10 04:15:50.392699', 'PER_ANSWER');
INSERT INTO public.answers VALUES (68, 54, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:50.528248', '2026-10-10 04:15:50.528248', 'PER_ANSWER');
INSERT INTO public.answers VALUES (69, 55, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:50.665052', '2026-10-10 04:15:50.665052', 'PER_ANSWER');
INSERT INTO public.answers VALUES (70, 56, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:50.800895', '2026-10-10 04:15:50.800895', 'PER_ANSWER');
INSERT INTO public.answers VALUES (71, 57, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:50.937261', '2026-10-10 04:15:50.937261', 'PER_ANSWER');
INSERT INTO public.answers VALUES (72, 58, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:51.073431', '2026-10-10 04:15:51.073431', 'PER_ANSWER');
INSERT INTO public.answers VALUES (73, 59, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:51.209265', '2026-10-10 04:15:51.209265', 'PER_ANSWER');
INSERT INTO public.answers VALUES (74, 60, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:51.348968', '2026-10-10 04:15:51.348968', 'PER_ANSWER');
INSERT INTO public.answers VALUES (75, 61, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:51.484278', '2026-10-10 04:15:51.484278', 'PER_ANSWER');
INSERT INTO public.answers VALUES (76, 62, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 04:15:51.619997', '2026-10-10 04:15:51.619997', 'PER_ANSWER');
INSERT INTO public.answers VALUES (77, 63, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 04:15:51.755452', '2026-10-10 04:15:51.755452', 'PER_ANSWER');
INSERT INTO public.answers VALUES (78, 64, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 04:15:51.890713', '2026-10-10 04:15:51.890713', 'PER_ANSWER');
INSERT INTO public.answers VALUES (79, 65, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 04:15:52.026272', '2026-10-10 04:15:52.026272', 'PER_ANSWER');
INSERT INTO public.answers VALUES (80, 66, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 04:15:52.16251', '2026-10-10 04:15:52.16251', 'PER_ANSWER');
INSERT INTO public.answers VALUES (81, 67, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '3', NULL, false, '2026-10-10 04:15:52.298047', '2026-10-10 04:15:52.298047', 'PER_ANSWER');
INSERT INTO public.answers VALUES (82, 68, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '0,65', NULL, false, '2026-10-10 04:15:52.43471', '2026-10-10 04:15:52.43471', 'PER_ANSWER');
INSERT INTO public.answers VALUES (83, 69, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '600', NULL, false, '2026-10-10 04:15:52.570527', '2026-10-10 04:15:52.570527', 'PER_ANSWER');
INSERT INTO public.answers VALUES (84, 70, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '2025', NULL, false, '2026-10-10 04:15:52.706051', '2026-10-10 04:15:52.706051', 'PER_ANSWER');
INSERT INTO public.answers VALUES (85, 71, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '-2', NULL, false, '2026-10-10 04:15:52.841583', '2026-10-10 04:15:52.841583', 'PER_ANSWER');
INSERT INTO public.answers VALUES (86, 72, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '18,9', NULL, false, '2026-10-10 04:15:52.977197', '2026-10-10 04:15:52.977197', 'PER_ANSWER');
INSERT INTO public.answers VALUES (43, 29, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-09 13:11:29.016028', '2026-10-10 04:18:21.98373', 'PER_ANSWER');
INSERT INTO public.answers VALUES (44, 30, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-09 13:11:29.172381', '2026-10-10 04:18:21.983757', 'PER_ANSWER');
INSERT INTO public.answers VALUES (45, 31, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:29.314448', '2026-10-10 04:18:21.983769', 'PER_ANSWER');
INSERT INTO public.answers VALUES (51, 37, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:30.161753', '2026-10-10 04:18:21.983796', 'PER_ANSWER');
INSERT INTO public.answers VALUES (52, 38, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:30.304244', '2026-10-10 04:18:21.983819', 'PER_ANSWER');
INSERT INTO public.answers VALUES (53, 39, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-09 13:11:30.446069', '2026-10-10 04:18:21.983836', 'PER_ANSWER');
INSERT INTO public.answers VALUES (55, 41, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-09 13:11:30.728403', '2026-10-10 04:18:21.983852', 'PER_ANSWER');
INSERT INTO public.answers VALUES (56, 42, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-09 13:11:30.870469', '2026-10-10 04:18:21.983864', 'PER_ANSWER');
INSERT INTO public.answers VALUES (57, 43, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-09 13:11:31.012004', '2026-10-10 04:18:21.983876', 'PER_ANSWER');
INSERT INTO public.answers VALUES (58, 44, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-09 13:11:31.154208', '2026-10-10 04:18:21.983905', 'PER_ANSWER');
INSERT INTO public.answers VALUES (63, 49, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '5,6', NULL, false, '2026-10-09 13:11:31.860305', '2026-10-10 04:18:21.983965', 'PER_ANSWER');
INSERT INTO public.answers VALUES (64, 50, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '54', NULL, false, '2026-10-09 13:11:32.001446', '2026-10-10 04:18:21.983978', 'PER_ANSWER');
INSERT INTO public.answers VALUES (87, 73, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-10 05:18:55.241842', '2026-10-10 05:18:55.241842', 'PER_ANSWER');
INSERT INTO public.answers VALUES (88, 74, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-10 05:18:55.385788', '2026-10-10 05:18:55.385788', 'PER_ANSWER');
INSERT INTO public.answers VALUES (89, 75, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:55.517257', '2026-10-10 05:18:55.517257', 'PER_ANSWER');
INSERT INTO public.answers VALUES (90, 76, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:55.648553', '2026-10-10 05:18:55.648553', 'PER_ANSWER');
INSERT INTO public.answers VALUES (91, 77, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:55.782781', '2026-10-10 05:18:55.782781', 'PER_ANSWER');
INSERT INTO public.answers VALUES (92, 78, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:55.914861', '2026-10-10 05:18:55.914861', 'PER_ANSWER');
INSERT INTO public.answers VALUES (93, 79, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:56.046221', '2026-10-10 05:18:56.046221', 'PER_ANSWER');
INSERT INTO public.answers VALUES (94, 80, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:56.177222', '2026-10-10 05:18:56.177222', 'PER_ANSWER');
INSERT INTO public.answers VALUES (95, 81, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:56.308567', '2026-10-10 05:18:56.308567', 'PER_ANSWER');
INSERT INTO public.answers VALUES (96, 82, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:56.439627', '2026-10-10 05:18:56.439627', 'PER_ANSWER');
INSERT INTO public.answers VALUES (97, 83, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:56.570729', '2026-10-10 05:18:56.570729', 'PER_ANSWER');
INSERT INTO public.answers VALUES (98, 84, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 05:18:56.701493', '2026-10-10 05:18:56.701493', 'PER_ANSWER');
INSERT INTO public.answers VALUES (99, 85, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 05:18:56.832451', '2026-10-10 05:18:56.832451', 'PER_ANSWER');
INSERT INTO public.answers VALUES (100, 86, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 05:18:56.963298', '2026-10-10 05:18:56.963298', 'CORRECT_COUNT');
INSERT INTO public.answers VALUES (101, 87, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 05:18:57.095806', '2026-10-10 05:18:57.095806', 'CORRECT_COUNT');
INSERT INTO public.answers VALUES (102, 88, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 05:18:57.227727', '2026-10-10 05:18:57.227727', 'PER_ANSWER');
INSERT INTO public.answers VALUES (103, 89, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '7', NULL, false, '2026-10-10 05:18:57.358873', '2026-10-10 05:18:57.358873', 'PER_ANSWER');
INSERT INTO public.answers VALUES (104, 90, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '19,8', NULL, false, '2026-10-10 05:18:57.48978', '2026-10-10 05:18:57.48978', 'PER_ANSWER');
INSERT INTO public.answers VALUES (105, 91, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '-6', NULL, false, '2026-10-10 05:18:57.620745', '2026-10-10 05:18:57.620745', 'PER_ANSWER');
INSERT INTO public.answers VALUES (106, 92, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '120', NULL, false, '2026-10-10 05:18:57.751579', '2026-10-10 05:18:57.751579', 'PER_ANSWER');
INSERT INTO public.answers VALUES (107, 93, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '80', NULL, false, '2026-10-10 05:18:57.882781', '2026-10-10 05:18:57.882781', 'PER_ANSWER');
INSERT INTO public.answers VALUES (108, 94, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '0,91', NULL, false, '2026-10-10 05:18:58.013615', '2026-10-10 05:18:58.013615', 'PER_ANSWER');
INSERT INTO public.answers VALUES (109, 95, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-10 09:12:29.206052', '2026-10-10 09:12:29.206052', 'PER_ANSWER');
INSERT INTO public.answers VALUES (110, 96, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.44, NULL, NULL, false, '2026-10-10 09:12:29.356638', '2026-10-10 09:12:29.356638', 'PER_ANSWER');
INSERT INTO public.answers VALUES (111, 97, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:29.493689', '2026-10-10 09:12:29.493689', 'PER_ANSWER');
INSERT INTO public.answers VALUES (112, 98, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:29.630355', '2026-10-10 09:12:29.630355', 'PER_ANSWER');
INSERT INTO public.answers VALUES (113, 99, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:29.767446', '2026-10-10 09:12:29.767446', 'PER_ANSWER');
INSERT INTO public.answers VALUES (114, 100, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:29.904548', '2026-10-10 09:12:29.904548', 'PER_ANSWER');
INSERT INTO public.answers VALUES (115, 101, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:30.041121', '2026-10-10 09:12:30.041121', 'PER_ANSWER');
INSERT INTO public.answers VALUES (116, 102, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:30.178475', '2026-10-10 09:12:30.178475', 'PER_ANSWER');
INSERT INTO public.answers VALUES (117, 103, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:30.315016', '2026-10-10 09:12:30.315016', 'PER_ANSWER');
INSERT INTO public.answers VALUES (118, 104, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:30.451553', '2026-10-10 09:12:30.451553', 'PER_ANSWER');
INSERT INTO public.answers VALUES (119, 105, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:30.5883', '2026-10-10 09:12:30.5883', 'PER_ANSWER');
INSERT INTO public.answers VALUES (120, 106, 'SINGLE_CHOICE', NULL, NULL, NULL, 1, 0.45, NULL, NULL, false, '2026-10-10 09:12:30.724992', '2026-10-10 09:12:30.724992', 'PER_ANSWER');
INSERT INTO public.answers VALUES (121, 107, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 09:12:30.861619', '2026-10-10 09:12:30.861619', 'PER_ANSWER');
INSERT INTO public.answers VALUES (122, 108, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 09:12:30.998619', '2026-10-10 09:12:30.998619', 'PER_ANSWER');
INSERT INTO public.answers VALUES (123, 109, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 09:12:31.135322', '2026-10-10 09:12:31.135322', 'PER_ANSWER');
INSERT INTO public.answers VALUES (124, 110, 'TRUE_FALSE', NULL, NULL, NULL, 1, 0.48, NULL, NULL, false, '2026-10-10 09:12:31.274679', '2026-10-10 09:12:31.274679', 'PER_ANSWER');
INSERT INTO public.answers VALUES (125, 111, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '0,87', NULL, false, '2026-10-10 09:12:31.411446', '2026-10-10 09:12:31.411446', 'PER_ANSWER');
INSERT INTO public.answers VALUES (126, 112, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '4', NULL, false, '2026-10-10 09:12:31.54784', '2026-10-10 09:12:31.54784', 'PER_ANSWER');
INSERT INTO public.answers VALUES (127, 113, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '0,32', NULL, false, '2026-10-10 09:12:31.684637', '2026-10-10 09:12:31.684637', 'PER_ANSWER');
INSERT INTO public.answers VALUES (128, 114, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '10,7', NULL, false, '2026-10-10 09:12:31.823797', '2026-10-10 09:12:31.823797', 'PER_ANSWER');
INSERT INTO public.answers VALUES (129, 115, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '232', NULL, false, '2026-10-10 09:12:31.960364', '2026-10-10 09:12:31.960364', 'PER_ANSWER');
INSERT INTO public.answers VALUES (130, 116, 'SHORT_ANSWER', NULL, NULL, NULL, 1, 0.45, '106', NULL, false, '2026-10-10 09:12:32.097072', '2026-10-10 09:12:32.097072', 'PER_ANSWER');


--
-- TOC entry 4304 (class 0 OID 18890)
-- Dependencies: 437
-- Data for Name: attempt_section_scores; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4274 (class 0 OID 17744)
-- Dependencies: 407
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.attendances VALUES (1, 10, 2, '2026-10-01', 'LATE', '', NULL, '2026-10-04 12:29:31.747037');
INSERT INTO public.attendances VALUES (2, 14, 2, '2026-10-02', 'ABSENT', '', NULL, '2026-10-04 12:29:31.747037');
INSERT INTO public.attendances VALUES (3, 14, 3, '2026-10-02', 'LATE', '', NULL, '2026-10-04 12:29:31.747037');
INSERT INTO public.attendances VALUES (5, 10, 2, '2026-10-02', 'PRESENT', '', NULL, '2026-10-04 12:29:31.747037');


--
-- TOC entry 4279 (class 0 OID 18492)
-- Dependencies: 412
-- Data for Name: class_join_request_details; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.class_join_request_details VALUES (2, 16);
INSERT INTO public.class_join_request_details VALUES (3, 16);


--
-- TOC entry 4270 (class 0 OID 17711)
-- Dependencies: 403
-- Data for Name: class_students; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.class_students VALUES (10, 2, '2026-09-30 17:47:04.0938');
INSERT INTO public.class_students VALUES (14, 2, '2026-10-01 17:31:57.598396');
INSERT INTO public.class_students VALUES (14, 3, '2026-10-01 17:32:20.829704');
INSERT INTO public.class_students VALUES (7, 10, '2026-10-06 10:30:21.289895');
INSERT INTO public.class_students VALUES (7, 13, '2026-10-06 10:30:21.724645');
INSERT INTO public.class_students VALUES (7, 14, '2026-10-06 10:30:22.1466');
INSERT INTO public.class_students VALUES (7, 16, '2026-10-06 10:30:22.564298');
INSERT INTO public.class_students VALUES (16, 20, '2026-10-10 13:31:29.016032');
INSERT INTO public.class_students VALUES (6, 16, '2026-10-11 08:41:24.79492');


--
-- TOC entry 4269 (class 0 OID 17687)
-- Dependencies: 402
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.classes VALUES (7, 'Lớp Anh 12A6', 'ENGLISH-12A6', 2, 8, 'Hay', 'ARCHIVED', '2026-09-28 18:09:08.326475', '2026-09-29 15:11:37.572657', '2026-2027');
INSERT INTO public.classes VALUES (2, 'Lớp Anh 12A2', 'ENGLISH-12A2', 2, 8, 'bảo đẹp trai', 'ACTIVE', '2026-09-28 15:15:34.745391', '2026-09-29 08:40:17.834292', '2026-2027');
INSERT INTO public.classes VALUES (6, 'Lớp Toán 12A', 'MATH-12A5', 1, 8, '', 'ACTIVE', '2026-09-28 16:31:05.783572', '2026-09-29 16:19:27.044554', '2026-2027');
INSERT INTO public.classes VALUES (11, 'lớp anh 12A2', 'ENGLISH-12A9', 2, 12, 'l', 'ARCHIVED', '2026-09-30 16:11:16.889884', '2026-09-30 16:11:52.150651', '2026-2027');
INSERT INTO public.classes VALUES (12, 'abc', 'LUCKY', 1, 12, '', 'ACTIVE', '2026-09-30 16:12:06.685976', '2026-09-30 16:12:06.685976', '2026-2027');
INSERT INTO public.classes VALUES (13, 'Lớp Vật lý 12A4', '8-PHYSICS-hycgu', 3, 8, '', 'ARCHIVED', '2026-10-01 10:24:57.546677', '2026-10-01 10:27:06.119133', '2026-2027');
INSERT INTO public.classes VALUES (14, 'Lớp Toán 12A1', '11-MATH-swtqj', 1, 11, 'l', 'ACTIVE', '2026-10-01 17:18:26.338897', '2026-10-01 17:18:26.338897', '2026-2027');
INSERT INTO public.classes VALUES (10, 'Lớp Toán 12A7', 'MATH-12A7', 1, 11, '', 'ACTIVE', '2026-09-30 14:20:04.710724', '2026-10-02 06:19:25.40245', '2026-2027');
INSERT INTO public.classes VALUES (16, 'Lớp toán học thêm', '8-MATH-xsmtb', 1, 8, '', 'ACTIVE', '2026-10-10 13:15:59.677094', '2026-10-10 13:15:59.677094', '2026-2027');


--
-- TOC entry 4297 (class 0 OID 18805)
-- Dependencies: 430
-- Data for Name: exam_assignment_classes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4298 (class 0 OID 18821)
-- Dependencies: 431
-- Data for Name: exam_assignment_students; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4296 (class 0 OID 18783)
-- Dependencies: 429
-- Data for Name: exam_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exam_assignments VALUES (1, 1, 'CLASS', NULL, NULL, NULL, NULL, 'OPEN', '2026-10-06 16:24:18.730131', '2026-10-06 16:24:18.730131', 'NEVER', 'NEVER', NULL, false);
INSERT INTO public.exam_assignments VALUES (4, 4, 'ALL', NULL, NULL, NULL, NULL, 'DRAFT', '2026-10-09 12:04:32.355729', '2026-10-09 12:04:32.355729', 'AFTER_SUBMIT', 'AFTER_SUBMIT', NULL, false);
INSERT INTO public.exam_assignments VALUES (5, 5, 'ALL', NULL, NULL, NULL, NULL, 'DRAFT', '2026-10-09 13:11:25.27521', '2026-10-09 13:11:25.27521', 'AFTER_SUBMIT', 'AFTER_SUBMIT', NULL, false);
INSERT INTO public.exam_assignments VALUES (6, 6, 'ALL', NULL, NULL, NULL, NULL, 'DRAFT', '2026-10-10 04:15:46.524844', '2026-10-10 04:15:46.524844', 'AFTER_SUBMIT', 'AFTER_SUBMIT', NULL, false);
INSERT INTO public.exam_assignments VALUES (7, 7, 'ALL', NULL, NULL, NULL, NULL, 'DRAFT', '2026-10-10 05:18:51.800532', '2026-10-10 05:18:51.800532', 'AFTER_SUBMIT', 'AFTER_SUBMIT', NULL, false);
INSERT INTO public.exam_assignments VALUES (8, 8, 'ALL', NULL, NULL, NULL, NULL, 'DRAFT', '2026-10-10 09:12:25.610791', '2026-10-10 09:12:25.610791', 'AFTER_SUBMIT', 'AFTER_SUBMIT', NULL, false);


--
-- TOC entry 4302 (class 0 OID 18874)
-- Dependencies: 435
-- Data for Name: exam_attempt_events; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4300 (class 0 OID 18838)
-- Dependencies: 433
-- Data for Name: exam_attempts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exam_attempts VALUES (1, 1, 5, 1, 0, NULL, NULL, NULL, 8.00, 0.00, 8.00, 'SUBMITTED', NULL, '2026-10-06 16:24:18.730131', '2026-10-06 16:24:18.730131');


--
-- TOC entry 4310 (class 0 OID 19045)
-- Dependencies: 443
-- Data for Name: exam_media; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exam_media VALUES ('1792f300-0a54-4957-ad21-b32a9206cdc5', 17, '46463712-c965-485a-877d-b2e30ed8e95e', 'exam-media/gv_17/46463712-c965-485a-877d-b2e30ed8e95e/1792f300-0a54-4957-ad21-b32a9206cdc5.png', 'IMAGE', 'image/png', 219248, 'ATTACHED', 4, '2026-10-09 12:04:29.113102', '2026-10-10 12:04:30.571622', '2026-10-10 12:04:30.571622', 0);
INSERT INTO public.exam_media VALUES ('5656839e-2358-4ce2-987e-0abf29540165', 17, '46463712-c965-485a-877d-b2e30ed8e95e', 'exam-media/gv_17/46463712-c965-485a-877d-b2e30ed8e95e/5656839e-2358-4ce2-987e-0abf29540165.png', 'IMAGE', 'image/png', 217780, 'ATTACHED', 4, '2026-10-09 12:04:25.889304', '2026-10-10 12:04:28.29679', '2026-10-10 12:04:28.29679', 0);
INSERT INTO public.exam_media VALUES ('83a1229c-ecb8-42a2-b051-6e9b6d8795fd', 17, '391ce795-1033-4335-ade4-eab1d191f106', 'exam-media/gv_17/391ce795-1033-4335-ade4-eab1d191f106/83a1229c-ecb8-42a2-b051-6e9b6d8795fd.png', 'IMAGE', 'image/png', 4282, 'ATTACHED', 5, '2026-10-09 13:11:19.440627', '2026-10-10 13:11:21.302797', '2026-10-10 13:11:21.302797', 0);
INSERT INTO public.exam_media VALUES ('84697441-8b27-47af-a8bd-72d15657ae2d', 17, '391ce795-1033-4335-ade4-eab1d191f106', 'exam-media/gv_17/391ce795-1033-4335-ade4-eab1d191f106/84697441-8b27-47af-a8bd-72d15657ae2d.png', 'IMAGE', 'image/png', 6419, 'ATTACHED', 5, '2026-10-09 13:11:22.05818', '2026-10-10 13:11:23.28692', '2026-10-10 13:11:23.28692', 0);
INSERT INTO public.exam_media VALUES ('63b3eb7e-10b1-4105-b26e-1d27d971d41f', 17, '79c2c725-ebd8-4d9f-a595-72e1ecced22d', 'exam-media/gv_17/79c2c725-ebd8-4d9f-a595-72e1ecced22d/63b3eb7e-10b1-4105-b26e-1d27d971d41f.png', 'IMAGE', 'image/png', 4187, 'ATTACHED', 6, '2026-10-10 04:15:39.340833', '2026-10-11 04:15:41.239186', '2026-10-11 04:15:41.239186', 0);
INSERT INTO public.exam_media VALUES ('825321da-72da-4a9b-896a-966f7718c3bc', 17, '79c2c725-ebd8-4d9f-a595-72e1ecced22d', 'exam-media/gv_17/79c2c725-ebd8-4d9f-a595-72e1ecced22d/825321da-72da-4a9b-896a-966f7718c3bc.png', 'IMAGE', 'image/png', 6944, 'ATTACHED', 6, '2026-10-10 04:15:41.934938', '2026-10-11 04:15:42.74837', '2026-10-11 04:15:42.74837', 0);
INSERT INTO public.exam_media VALUES ('b94e9b5c-87e2-436b-8c30-fa4555b36519', 17, '79c2c725-ebd8-4d9f-a595-72e1ecced22d', 'exam-media/gv_17/79c2c725-ebd8-4d9f-a595-72e1ecced22d/b94e9b5c-87e2-436b-8c30-fa4555b36519.png', 'IMAGE', 'image/png', 9178, 'ATTACHED', 6, '2026-10-10 04:15:43.416935', '2026-10-11 04:15:44.622111', '2026-10-11 04:15:44.622111', 0);
INSERT INTO public.exam_media VALUES ('3234d17f-201a-4858-b8f0-66360138c259', 17, 'f4a1c73f-7860-463f-a6b5-139b5599b95f', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/3234d17f-201a-4858-b8f0-66360138c259.png', 'IMAGE', 'image/png', 7137, 'ATTACHED', 7, '2026-10-10 05:18:41.500688', '2026-10-11 05:18:42.267744', '2026-10-11 05:18:42.267744', 0);
INSERT INTO public.exam_media VALUES ('a2dc90e8-110e-4c11-b67e-bdf3fd031dcb', 17, 'f4a1c73f-7860-463f-a6b5-139b5599b95f', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/a2dc90e8-110e-4c11-b67e-bdf3fd031dcb.png', 'IMAGE', 'image/png', 4375, 'ATTACHED', 7, '2026-10-10 05:18:42.889404', '2026-10-11 05:18:44.08125', '2026-10-11 05:18:44.08125', 0);
INSERT INTO public.exam_media VALUES ('bab33590-dc78-4154-86a0-9dfada117748', 17, 'f4a1c73f-7860-463f-a6b5-139b5599b95f', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/bab33590-dc78-4154-86a0-9dfada117748.png', 'IMAGE', 'image/png', 4870, 'ATTACHED', 7, '2026-10-10 05:18:39.673752', '2026-10-11 05:18:40.848309', '2026-10-11 05:18:40.848309', 0);
INSERT INTO public.exam_media VALUES ('bf264d05-925b-4b19-94e3-c77cc65992d7', 17, 'f4a1c73f-7860-463f-a6b5-139b5599b95f', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/bf264d05-925b-4b19-94e3-c77cc65992d7.png', 'IMAGE', 'image/png', 7384, 'ATTACHED', 7, '2026-10-10 05:18:48.220747', '2026-10-11 05:18:50.090019', '2026-10-11 05:18:50.090019', 0);
INSERT INTO public.exam_media VALUES ('cb301cfd-c63c-425c-a387-04829fd620df', 17, 'f4a1c73f-7860-463f-a6b5-139b5599b95f', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/cb301cfd-c63c-425c-a387-04829fd620df.png', 'IMAGE', 'image/png', 9810, 'ATTACHED', 7, '2026-10-10 05:18:46.574529', '2026-10-11 05:18:47.588234', '2026-10-11 05:18:47.588234', 0);
INSERT INTO public.exam_media VALUES ('cb74af92-1817-4abc-8241-3ddd41d49151', 17, 'f4a1c73f-7860-463f-a6b5-139b5599b95f', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/cb74af92-1817-4abc-8241-3ddd41d49151.png', 'IMAGE', 'image/png', 9138, 'ATTACHED', 7, '2026-10-10 05:18:44.716589', '2026-10-11 05:18:45.923026', '2026-10-11 05:18:45.923026', 0);
INSERT INTO public.exam_media VALUES ('df82180e-d665-4ac6-96b7-36296ddacac9', 17, 'f4a1c73f-7860-463f-a6b5-139b5599b95f', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/df82180e-d665-4ac6-96b7-36296ddacac9.png', 'IMAGE', 'image/png', 6158, 'ATTACHED', 7, '2026-10-10 05:18:37.239369', '2026-10-11 05:18:38.982602', '2026-10-11 05:18:38.982602', 0);
INSERT INTO public.exam_media VALUES ('162e3577-f6a1-4acb-a113-868620c3c933', 17, 'babf9c18-be60-4860-acfa-155319dd6f36', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/162e3577-f6a1-4acb-a113-868620c3c933.png', 'IMAGE', 'image/png', 12728, 'ATTACHED', 8, '2026-10-10 09:12:13.366765', '2026-10-11 09:12:14.753896', '2026-10-11 09:12:14.753896', 0);
INSERT INTO public.exam_media VALUES ('3317b9c7-7f6b-498e-bb59-c8fd496ca1bc', 17, 'babf9c18-be60-4860-acfa-155319dd6f36', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/3317b9c7-7f6b-498e-bb59-c8fd496ca1bc.png', 'IMAGE', 'image/png', 19408, 'ATTACHED', 8, '2026-10-10 09:12:21.639129', '2026-10-11 09:12:22.686441', '2026-10-11 09:12:22.686441', 0);
INSERT INTO public.exam_media VALUES ('4c9b71cf-f279-47d5-8907-709fdcda9f84', 17, 'babf9c18-be60-4860-acfa-155319dd6f36', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/4c9b71cf-f279-47d5-8907-709fdcda9f84.png', 'IMAGE', 'image/png', 5103, 'ATTACHED', 8, '2026-10-10 09:12:23.328461', '2026-10-11 09:12:24.118515', '2026-10-11 09:12:24.118515', 0);
INSERT INTO public.exam_media VALUES ('6383a0c1-f443-43cd-83ee-35b9c80c953d', 17, 'babf9c18-be60-4860-acfa-155319dd6f36', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/6383a0c1-f443-43cd-83ee-35b9c80c953d.png', 'IMAGE', 'image/png', 5134, 'ATTACHED', 8, '2026-10-10 09:12:18.718151', '2026-10-11 09:12:19.51761', '2026-10-11 09:12:19.51761', 0);
INSERT INTO public.exam_media VALUES ('971241f4-80c7-4fca-988a-5f2e409ed760', 17, 'babf9c18-be60-4860-acfa-155319dd6f36', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/971241f4-80c7-4fca-988a-5f2e409ed760.png', 'IMAGE', 'image/png', 8062, 'ATTACHED', 8, '2026-10-10 09:12:15.417232', '2026-10-11 09:12:16.624832', '2026-10-11 09:12:16.624832', 0);
INSERT INTO public.exam_media VALUES ('af9f8197-bc9e-4c86-bbd9-5e21b0ebe907', 17, 'babf9c18-be60-4860-acfa-155319dd6f36', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/af9f8197-bc9e-4c86-bbd9-5e21b0ebe907.png', 'IMAGE', 'image/png', 7962, 'ATTACHED', 8, '2026-10-10 09:12:17.27986', '2026-10-11 09:12:18.074261', '2026-10-11 09:12:18.074261', 0);
INSERT INTO public.exam_media VALUES ('d7099729-9058-4067-9b2e-fc1118ac3a80', 17, 'babf9c18-be60-4860-acfa-155319dd6f36', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/d7099729-9058-4067-9b2e-fc1118ac3a80.png', 'IMAGE', 'image/png', 5900, 'ATTACHED', 8, '2026-10-10 09:12:20.183534', '2026-10-11 09:12:20.990611', '2026-10-11 09:12:20.990611', 0);


--
-- TOC entry 4286 (class 0 OID 18674)
-- Dependencies: 419
-- Data for Name: exam_sections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exam_sections VALUES (3, 4, 'Phần 1', NULL, NULL, NULL, 1, 4.50, '2026-10-09 12:04:32.505726', '2026-10-09 12:04:32.505726');
INSERT INTO public.exam_sections VALUES (4, 4, 'Phần 2', NULL, NULL, NULL, 2, 2.50, '2026-10-09 12:04:32.648312', '2026-10-09 12:04:32.648312');
INSERT INTO public.exam_sections VALUES (5, 4, 'Phần 3', NULL, NULL, NULL, 3, 1.50, '2026-10-09 12:04:32.778274', '2026-10-09 12:04:32.778274');
INSERT INTO public.exam_sections VALUES (6, 4, 'Phần 4', NULL, NULL, NULL, 4, 1.50, '2026-10-09 12:04:32.906718', '2026-10-09 12:04:32.906718');
INSERT INTO public.exam_sections VALUES (10, 6, 'Phần 1', NULL, NULL, NULL, 1, 5.38, '2026-10-10 04:15:46.684202', '2026-10-10 04:15:46.684202');
INSERT INTO public.exam_sections VALUES (11, 6, 'Phần 2', NULL, NULL, NULL, 2, 1.92, '2026-10-10 04:15:46.835193', '2026-10-10 04:15:46.835193');
INSERT INTO public.exam_sections VALUES (12, 6, 'Phần 3', NULL, NULL, NULL, 3, 2.70, '2026-10-10 04:15:46.970989', '2026-10-10 04:15:46.970989');
INSERT INTO public.exam_sections VALUES (7, 5, 'Phần 1', NULL, NULL, NULL, 1, 5.38, '2026-10-09 13:11:25.440393', '2026-10-10 04:18:21.983455');
INSERT INTO public.exam_sections VALUES (8, 5, 'Phần 2', NULL, NULL, NULL, 2, 1.92, '2026-10-09 13:11:25.588944', '2026-10-10 04:18:21.983475');
INSERT INTO public.exam_sections VALUES (9, 5, 'Phần 3', NULL, NULL, NULL, 3, 2.70, '2026-10-09 13:11:25.730771', '2026-10-10 04:18:21.983484');
INSERT INTO public.exam_sections VALUES (13, 7, 'Phần 1', NULL, NULL, NULL, 1, 5.38, '2026-10-10 05:18:51.943751', '2026-10-10 05:18:51.943751');
INSERT INTO public.exam_sections VALUES (14, 7, 'Phần 2', NULL, NULL, NULL, 2, 1.92, '2026-10-10 05:18:52.077709', '2026-10-10 05:18:52.077709');
INSERT INTO public.exam_sections VALUES (15, 7, 'Phần 3', NULL, NULL, NULL, 3, 2.70, '2026-10-10 05:18:52.209375', '2026-10-10 05:18:52.209375');
INSERT INTO public.exam_sections VALUES (16, 8, 'Phần 1', NULL, NULL, NULL, 1, 5.38, '2026-10-10 09:12:25.759102', '2026-10-10 09:12:25.759102');
INSERT INTO public.exam_sections VALUES (17, 8, 'Phần 2', NULL, NULL, NULL, 2, 1.92, '2026-10-10 09:12:25.904647', '2026-10-10 09:12:25.904647');
INSERT INTO public.exam_sections VALUES (18, 8, 'Phần 3', NULL, NULL, NULL, 3, 2.70, '2026-10-10 09:12:26.042239', '2026-10-10 09:12:26.042239');


--
-- TOC entry 4284 (class 0 OID 18644)
-- Dependencies: 417
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.exams VALUES (1, 8, NULL, 'Kiểm tra giữa kỳ - Java', 'Đề thi mock dùng để test API', 'Đại học', 'MIDTERM', 60, 1, 10.00, 'PUBLISHED', '2026-10-06 16:24:18.730131', '2026-10-06 16:24:18.730131', 'JAVA-MOCK-01', 0);
INSERT INTO public.exams VALUES (4, 17, 2, 'KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2025', NULL, 'OTHER', NULL, 50, 2, 10.00, 'DRAFT', '2026-10-09 12:04:32.043799', '2026-10-09 12:04:32.043799', 'EX-17-WHXUUF', 0);
INSERT INTO public.exams VALUES (6, 17, 1, 'BỘ ĐỀ ÔN THI THPT QUỐC GIA 2025 -2026 ĐỀ THI THỬ TỐT NGHIỆP THPT — ĐỀ 2', NULL, '12', 'Ôn thi', 90, 1, 10.00, 'DRAFT', '2026-10-10 04:15:46.205895', '2026-10-10 04:15:46.205895', 'EX-17-YQPQWX', 0);
INSERT INTO public.exams VALUES (5, 17, 1, 'BỘ ĐỀ ÔN THI THPT QUỐC GIA 2025-2026 ĐỀ THI THỬ TỐT NGHIỆP THPT— ĐỀ 1', NULL, '12', 'Ôn thi', 90, 1, 10.00, 'DRAFT', '2026-10-09 13:11:24.944133', '2026-10-10 04:18:48.838761', 'EX-17-SNTBUK', 2);
INSERT INTO public.exams VALUES (7, 17, 1, 'BỘ ĐỀ ÔN THI THPT QUỐC GIA 2025 -2026 ĐỀ THI THỬ TỐT NGHIỆP THPT — ĐỀ 3', NULL, '12', 'Ôn thi', 90, 1, 10.00, 'DRAFT', '2026-10-10 05:18:51.51257', '2026-10-10 05:18:51.51257', 'EX-17-NICNJU', 0);
INSERT INTO public.exams VALUES (8, 17, 1, 'BỘ ĐỀ ÔN THI THPT QUỐC GIA 2025 -2026 ĐỀ THI THỬ TỐT NGHIỆP THPT — ĐỀ 4', NULL, '12', 'Ôn thi', 90, 1, 10.00, 'DRAFT', '2026-10-10 09:12:25.309565', '2026-10-10 09:12:25.309565', 'EX-17-ESEOBL', 0);


--
-- TOC entry 4263 (class 0 OID 17597)
-- Dependencies: 396
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.flyway_schema_history VALUES (1, '1', 'create users table', 'SQL', 'V1__create_users_table.sql', -1630466257, 'postgres', '2026-09-26 10:49:06.839653', 740, true);
INSERT INTO public.flyway_schema_history VALUES (2, '2', 'create subjects table', 'SQL', 'V2__create_subjects_table.sql', -897017384, 'postgres', '2026-09-27 07:32:39.517277', 668, true);
INSERT INTO public.flyway_schema_history VALUES (3, '3', 'create classes table', 'SQL', 'V3__create_classes_table.sql', 246777953, 'postgres', '2026-09-27 07:32:41.707023', 547, true);
INSERT INTO public.flyway_schema_history VALUES (4, '4', 'create class students table', 'SQL', 'V4__create_class_students_table.sql', 1094497022, 'postgres', '2026-09-27 07:32:43.783364', 533, true);
INSERT INTO public.flyway_schema_history VALUES (5, '5', 'create materials table', 'SQL', 'V5__create_materials_table.sql', -1439148248, 'postgres', '2026-09-27 07:32:45.478838', 497, true);
INSERT INTO public.flyway_schema_history VALUES (6, '6', 'create attendances table', 'SQL', 'V6__create_attendances_table.sql', -1026707171, 'postgres', '2026-09-27 07:32:47.143387', 739, true);
INSERT INTO public.flyway_schema_history VALUES (7, '7', 'create exams table', 'SQL', 'V7__create_exams_table.sql', 12733249, 'postgres', '2026-09-27 07:32:49.063355', 492, true);
INSERT INTO public.flyway_schema_history VALUES (8, '8', 'create class exams table', 'SQL', 'V8__create_class_exams_table.sql', 410365115, 'postgres', '2026-09-27 07:32:50.751439', 490, true);
INSERT INTO public.flyway_schema_history VALUES (9, '9', 'create questions table', 'SQL', 'V9__create_questions_table.sql', -1050039664, 'postgres', '2026-09-27 07:32:52.492524', 560, true);
INSERT INTO public.flyway_schema_history VALUES (10, '10', 'create question options table', 'SQL', 'V10__create_question_options_table.sql', 1429566178, 'postgres', '2026-09-27 07:32:54.431906', 492, true);
INSERT INTO public.flyway_schema_history VALUES (11, '11', 'create exam attempts table', 'SQL', 'V11__create_exam_attempts_table.sql', 518038726, 'postgres', '2026-09-27 07:32:56.120401', 604, true);
INSERT INTO public.flyway_schema_history VALUES (12, '12', 'create student answers table', 'SQL', 'V12__create_student_answers_table.sql', -2021398686, 'postgres', '2026-09-27 07:32:57.943656', 534, true);
INSERT INTO public.flyway_schema_history VALUES (13, '13', 'add academic year to classes', 'SQL', 'V13__add_academic_year_to_classes.sql', -652055900, 'postgres', '2026-09-28 09:19:35.58098', 652, true);
INSERT INTO public.flyway_schema_history VALUES (14, '14', 'make class academic year required', 'SQL', 'V14__make_class_academic_year_required.sql.sql', -132379209, 'postgres', '2026-09-28 09:24:01.396198', 521, true);
INSERT INTO public.flyway_schema_history VALUES (15, '15', 'add teacher code to users', 'SQL', 'V15__add_teacher_code_to_users.sql', 1288167601, 'postgres', '2026-10-01 19:20:32.331716', 683, true);
INSERT INTO public.flyway_schema_history VALUES (16, '16', 'class join requests  table', 'SQL', 'V16__class_join_requests _table.sql', -1363529297, 'postgres', '2026-10-01 19:20:34.741917', 667, true);
INSERT INTO public.flyway_schema_history VALUES (17, '17', 'create lessons table', 'SQL', 'V17__create_lessons_table.sql', -844792375, 'postgres', '2026-10-02 09:46:11.657724', 1091, true);
INSERT INTO public.flyway_schema_history VALUES (18, '18', 'create requests table', 'SQL', 'V18__create_requests_table.sql', 939305767, 'postgres', '2026-10-02 20:11:23.465782', 1385, true);
INSERT INTO public.flyway_schema_history VALUES (19, '19', 'migrate class join requests', 'SQL', 'V19__migrate_class_join_requests.sql', 108357976, 'postgres', '2026-10-02 20:11:26.741961', 727, true);
INSERT INTO public.flyway_schema_history VALUES (20, '20', 'create absence request details', 'SQL', 'V20__create_absence_request_details.sql', -801747041, 'postgres', '2026-10-02 20:11:29.197584', 874, true);
INSERT INTO public.flyway_schema_history VALUES (21, '21', 'create notifications table', 'SQL', 'V21__create_notifications_table.sql', -1946478677, 'postgres', '2026-10-02 20:11:31.7927', 1021, true);
INSERT INTO public.flyway_schema_history VALUES (22, '22', 'drop old class join requests table', 'SQL', 'V22__drop_old_class_join_requests_table.sql', -779429182, 'postgres', '2026-10-02 20:11:34.550868', 731, true);
INSERT INTO public.flyway_schema_history VALUES (23, '23', 'add lesson and created at to attendances', 'SQL', 'V23__add_lesson_and_created_at_to_attendances.sql', -1415003957, 'postgres', '2026-10-04 12:29:31.175375', 1220, true);
INSERT INTO public.flyway_schema_history VALUES (24, '24', 'enforce one lesson per class per day', 'SQL', 'V24__enforce_one_lesson_per_class_per_day.sql', -1448680582, 'postgres', '2026-10-04 12:29:34.17953', 958, true);
INSERT INTO public.flyway_schema_history VALUES (25, '25', 'cascade class deletion', 'SQL', 'V25__cascade_class_deletion.sql', -1099093948, 'postgres', '2026-10-04 17:50:29.80774', 2669, true);
INSERT INTO public.flyway_schema_history VALUES (26, '26', 'cascade all class foreign keys', 'SQL', 'V26__cascade_all_class_foreign_keys.sql', 1941922207, 'postgres', '2026-10-04 17:50:34.288098', 656, true);
INSERT INTO public.flyway_schema_history VALUES (27, '27', 'add classroom teacher index', 'SQL', 'V27__add_classroom_teacher_index.sql', -1012881641, 'postgres', '2026-10-06 04:03:59.965077', 755, true);
INSERT INTO public.flyway_schema_history VALUES (28, '28', 'reset exam module', 'SQL', 'V28__reset_exam_module.sql', -337581637, 'postgres', '2026-10-06 10:22:58.504232', 1378, true);
INSERT INTO public.flyway_schema_history VALUES (29, '29', 'create exams', 'SQL', 'V29__create_exams.sql', -1910578410, 'postgres', '2026-10-06 10:23:01.76255', 1090, true);
INSERT INTO public.flyway_schema_history VALUES (30, '30', 'create exam sections', 'SQL', 'V30__create_exam_sections.sql', 1174131726, 'postgres', '2026-10-06 10:23:04.469166', 793, true);
INSERT INTO public.flyway_schema_history VALUES (31, '31', 'create questions', 'SQL', 'V31__create_questions.sql', -1676285793, 'postgres', '2026-10-06 10:23:06.876901', 797, true);
INSERT INTO public.flyway_schema_history VALUES (32, '32', 'create answers', 'SQL', 'V32__create_answers.sql', -489333939, 'postgres', '2026-10-06 10:23:09.289177', 798, true);
INSERT INTO public.flyway_schema_history VALUES (33, '33', 'create answer options', 'SQL', 'V33__create_answer_options.sql', 536314622, 'postgres', '2026-10-06 10:23:11.70074', 797, true);
INSERT INTO public.flyway_schema_history VALUES (34, '34', 'create question scoring rules', 'SQL', 'V34__create_question_scoring_rules.sql', 1522807569, 'postgres', '2026-10-06 10:23:14.103007', 785, true);
INSERT INTO public.flyway_schema_history VALUES (35, '35', 'create exam assignments', 'SQL', 'V35__create_exam_assignments.sql', 377479828, 'postgres', '2026-10-06 10:23:16.464723', 1045, true);
INSERT INTO public.flyway_schema_history VALUES (36, '36', 'create exam assignment classes', 'SQL', 'V36__create_exam_assignment_classes.sql', 1775412623, 'postgres', '2026-10-06 10:23:19.085723', 783, true);
INSERT INTO public.flyway_schema_history VALUES (37, '37', 'create exam assignment students', 'SQL', 'V37__create_exam_assignment_students.sql', 1153497214, 'postgres', '2026-10-06 10:23:21.446252', 785, true);
INSERT INTO public.flyway_schema_history VALUES (38, '38', 'create exam attempts', 'SQL', 'V38__create_exam_attempts.sql', -1039008685, 'postgres', '2026-10-06 10:23:23.810166', 921, true);
INSERT INTO public.flyway_schema_history VALUES (39, '39', 'create exam attempt events', 'SQL', 'V39__create_exam_attempt_events.sql', 1012700338, 'postgres', '2026-10-06 10:23:26.307471', 785, true);
INSERT INTO public.flyway_schema_history VALUES (40, '40', 'create attempt section scores', 'SQL', 'V40__create_attempt_section_scores.sql', 1196657284, 'postgres', '2026-10-06 10:23:28.670088', 786, true);
INSERT INTO public.flyway_schema_history VALUES (41, '41', 'create student answers', 'SQL', 'V41__create_student_answers.sql', -11108492, 'postgres', '2026-10-06 10:23:31.035107', 916, true);
INSERT INTO public.flyway_schema_history VALUES (42, '42', 'create student answer values', 'SQL', 'V42__create_student_answer_values.sql', 2124656039, 'postgres', '2026-10-06 10:23:33.524885', 784, true);
INSERT INTO public.flyway_schema_history VALUES (43, '43', 'create student answer options', 'SQL', 'V43__create_student_answer_options.sql', 1842116189, 'postgres', '2026-10-06 10:23:35.887106', 783, true);
INSERT INTO public.flyway_schema_history VALUES (44, '44', 'add code to exams', 'SQL', 'V44__add_code_to_exams.sql', 1911631387, 'postgres', '2026-10-06 15:52:28.802168', 897, true);
INSERT INTO public.flyway_schema_history VALUES (45, '45', 'add exam assignment visibility settings', 'SQL', 'V45__add_exam_assignment_visibility_settings.sql', -1117612566, 'postgres', '2026-10-07 16:17:49.957846', 924, true);
INSERT INTO public.flyway_schema_history VALUES (46, '46', 'move scoring to answers', 'SQL', 'V46__move_scoring_to_answers.sql', 300308120, 'postgres', '2026-10-08 17:10:14.733152', 1736, true);
INSERT INTO public.flyway_schema_history VALUES (47, '47', 'allow unlimited exam attempts', 'SQL', 'V47__allow_unlimited_exam_attempts.sql', 1074440837, 'postgres', '2026-10-08 17:10:18.261751', 819, true);
INSERT INTO public.flyway_schema_history VALUES (48, '48', 'create exam media registry', 'SQL', 'V48__create_exam_media_registry.sql', -1437255523, 'postgres', '2026-10-08 17:10:20.70009', 1110, true);
INSERT INTO public.flyway_schema_history VALUES (49, '49', 'rename after close visibility to after exam', 'SQL', 'V49__rename_after_close_visibility_to_after_exam.sql', -371180060, 'postgres', '2026-10-08 17:10:23.42098', 1101, true);
INSERT INTO public.flyway_schema_history VALUES (50, '50', 'unify choice answer type', 'SQL', 'V50__unify_choice_answer_type.sql', -1640928024, 'postgres', '2026-10-08 17:10:26.134062', 960, true);
INSERT INTO public.flyway_schema_history VALUES (51, '51', 'restore choice answer types', 'SQL', 'V51__restore_choice_answer_types.sql', -2134054912, 'postgres', '2026-10-08 17:10:28.721137', 974, true);
INSERT INTO public.flyway_schema_history VALUES (52, '52', 'add exam revision', 'SQL', 'V52__add_exam_revision.sql', -1535453066, 'postgres', '2026-10-09 10:18:43.093961', 876, true);
INSERT INTO public.flyway_schema_history VALUES (53, '53', 'rename section description to paragraph', 'SQL', 'V53__rename_section_description_to_paragraph.sql', 1703202103, 'postgres', '2026-10-09 13:13:14.91054', 673, true);
INSERT INTO public.flyway_schema_history VALUES (54, '54', 'drop recreated legacy class join requests', 'SQL', 'V54__drop_recreated_legacy_class_join_requests.sql', 87412519, 'postgres', '2026-10-10 20:02:05.246338', 750, true);
INSERT INTO public.flyway_schema_history VALUES (55, '55', 'add class context to exam assignment students', 'SQL', 'V55__add_class_context_to_exam_assignment_students.sql', -2121956806, 'postgres', '2026-10-11 08:37:31.880476', 1079, true);


--
-- TOC entry 4276 (class 0 OID 18439)
-- Dependencies: 409
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4272 (class 0 OID 17728)
-- Dependencies: 405
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4282 (class 0 OID 18524)
-- Dependencies: 415
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.notifications VALUES (1, 5, 'REQUEST_APPROVED', 'Yêu cầu tham gia lớp được chấp nhận', 'Yêu cầu vào lớp Lớp Vật Lý 12a2 của bạn đã được chấp nhận', 'REQUEST', 1, false, '2026-10-04 14:14:07.567741');
INSERT INTO public.notifications VALUES (2, 20, 'REQUEST_APPROVED', 'Yêu cầu tham gia lớp được chấp nhận', 'Yêu cầu vào lớp Lớp toán học thêm của bạn đã được chấp nhận', 'REQUEST', 2, true, '2026-10-10 13:20:40.228714');
INSERT INTO public.notifications VALUES (3, 20, 'CLASS_REMOVED', 'Bạn đã bị xóa khỏi lớp', 'Bạn đã bị xóa khỏi lớp Lớp toán học thêm', 'CLASS', 16, true, '2026-10-10 13:30:36.283578');
INSERT INTO public.notifications VALUES (4, 20, 'REQUEST_APPROVED', 'Yêu cầu tham gia lớp được chấp nhận', 'Yêu cầu vào lớp Lớp toán học thêm của bạn đã được chấp nhận', 'REQUEST', 3, false, '2026-10-10 13:31:29.878616');
INSERT INTO public.notifications VALUES (5, 16, 'CLASS_ADDED', 'Bạn đã được giáo viên thêm vào lớp', 'Bạn đã được giáo viên thêm vào lớp Lớp Toán 12A', 'CLASS', 6, false, '2026-10-11 08:41:24.796087');


--
-- TOC entry 4294 (class 0 OID 18761)
-- Dependencies: 427
-- Data for Name: question_scoring_rules; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.question_scoring_rules VALUES (1, 3, 0.48, '2026-10-10 05:19:06.554137', '2026-10-10 05:19:06.554137', 100);
INSERT INTO public.question_scoring_rules VALUES (2, 2, 0.32, '2026-10-10 05:19:06.691096', '2026-10-10 05:19:06.691096', 100);
INSERT INTO public.question_scoring_rules VALUES (3, 1, 0.16, '2026-10-10 05:19:06.822191', '2026-10-10 05:19:06.822191', 100);
INSERT INTO public.question_scoring_rules VALUES (4, 0, 0.00, '2026-10-10 05:19:06.954491', '2026-10-10 05:19:06.954491', 100);
INSERT INTO public.question_scoring_rules VALUES (5, 4, 0.48, '2026-10-10 05:19:07.085573', '2026-10-10 05:19:07.085573', 100);
INSERT INTO public.question_scoring_rules VALUES (6, 3, 0.48, '2026-10-10 05:19:07.216631', '2026-10-10 05:19:07.216631', 101);
INSERT INTO public.question_scoring_rules VALUES (7, 2, 0.32, '2026-10-10 05:19:07.347457', '2026-10-10 05:19:07.347457', 101);
INSERT INTO public.question_scoring_rules VALUES (8, 1, 0.16, '2026-10-10 05:19:07.478627', '2026-10-10 05:19:07.478627', 101);
INSERT INTO public.question_scoring_rules VALUES (9, 0, 0.00, '2026-10-10 05:19:07.609993', '2026-10-10 05:19:07.609993', 101);
INSERT INTO public.question_scoring_rules VALUES (10, 4, 0.48, '2026-10-10 05:19:07.740825', '2026-10-10 05:19:07.740825', 101);


--
-- TOC entry 4288 (class 0 OID 18695)
-- Dependencies: 421
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.questions VALUES (3, 3, '$\underline{\text{Read the following passage and mark the letter A, B, C or D on your answer sheet to Indicate the option that best fits each of the numbered blanks from 1 to 5.}}$
All holidays involve some element of risk whether in the form of illness, bad weather, being unable to get what we want if we delay booking, or (1) $\underline{}\underline{\text{\placeholder{     }}}$. We ask ourselves what risks we would run if we went there, if there is a high likelihood of their-occurrence, if the risks are avoidable and how significant the consequences would be. Some tourists, of course, relish a degree of risk, as this gives an edge of excitement to the holiday, (2) $\underline{\text{\placeholder{     }}}$. Others, however, are risk averse and will studiously avoid risk wherever possible. Clearly, the significance of the risk will be a key factor. (3) $\underline{\text{\placeholder{     }}}$. The risk averse will book early, choose to return to the same resort and hotel they have visited, knowing its reliability, or book a package tour rather than travel independently.
(4) $\underline{\text{\placeholder{     }}}$. There is evidence that much of the continuing reluctance shown by some tourists to seek information and make bookings through Internet providers can be attributed to, in part, the lack of face-to-face contact with a trusted - and, hopefully, expert - travel agent and, in part, (5) $\underline{\text{\placeholder{     }}}$ in favour of the information provider.', NULL, NULL, 1, 1.25, '2026-10-09 12:04:33.036487', '2026-10-09 12:04:33.036487');
INSERT INTO public.questions VALUES (4, 3, 'Which of the following is NOT mentioned in paragraph 1 as a type of collected real-time data?', 'exam-media/gv_17/46463712-c965-485a-877d-b2e30ed8e95e/5656839e-2358-4ce2-987e-0abf29540165.png', NULL, 2, 0.25, '2026-10-09 12:04:33.182028', '2026-10-09 12:04:33.182028');
INSERT INTO public.questions VALUES (5, 3, 'The word $\underline{\text{accelerate}}$ in paragraph 1 can be best replaced by', NULL, NULL, 3, 0.25, '2026-10-09 12:04:33.311148', '2026-10-09 12:04:33.311148');
INSERT INTO public.questions VALUES (6, 3, 'The word$\underline{\text{curb}}$ in paragraph 2 is OPPOSITE in meaning to', NULL, NULL, 4, 0.25, '2026-10-09 12:04:33.43931', '2026-10-09 12:04:33.43931');
INSERT INTO public.questions VALUES (7, 3, 'The word $\underline{\text{it}}$ in paragraph 3 refers to', NULL, NULL, 5, 0.25, '2026-10-09 12:04:33.571277', '2026-10-09 12:04:33.571277');
INSERT INTO public.questions VALUES (8, 3, 'Which of the following best paraphrases the underlined sentence in paragraph 3 ?', NULL, NULL, 6, 0.25, '2026-10-09 12:04:33.700403', '2026-10-09 12:04:33.700403');
INSERT INTO public.questions VALUES (9, 3, 'Which of the following is TRUE according to paragraph 4 ?', NULL, NULL, 7, 0.25, '2026-10-09 12:04:33.829448', '2026-10-09 12:04:33.829448');
INSERT INTO public.questions VALUES (10, 3, 'Which paragraph mentions real time tracking of produce ?', NULL, NULL, 8, 0.25, '2026-10-09 12:04:33.957936', '2026-10-09 12:04:33.957936');
INSERT INTO public.questions VALUES (11, 3, 'Which paragraph mentions a preventive measure against biological threats ?', NULL, NULL, 9, 0.25, '2026-10-09 12:04:34.08603', '2026-10-09 12:04:34.08603');
INSERT INTO public.questions VALUES (12, 3, '$\underline{\text{Mark the letter A, B, C or D on your answer sheet to indicate the best arrangement of utterances or sentences to make a cohesive and coherent exchange or text in each of the following questions from 14 to 18.}}$
a. Marvelli has now become a more dynamic and prosperous city, offering greater opportunities for both residents and investors.
b. These vital improvements have notably boosted Marvelli''s economy, fostering the growth of local businesses and attracting foreign investment.
c. To accommodate this growth, city planners have replaced the older terraced housing with modern high-rise buildings and expanded public facilities such as schools and hospitals. 
d. Recognising the increasing traffic congestion, the city council has had the main roads widened and an intelligent traffic monitoring system installed to optimise traffic flow.
e Over the past decade, the city of Marvelli has undergone a considerable-transformation, experiencing an upsurge in poputation and an overload on the existing transport infrastructure.', NULL, NULL, 10, 0.25, '2026-10-09 12:04:34.214142', '2026-10-09 12:04:34.214142');
INSERT INTO public.questions VALUES (13, 3, 'a. Susan: I exercise regularly by jogging, swimming or doing martial arts. How about you?
b. Susan: That sounds great! I think dally exercise and a healthy diet are the key to staying healthy. c. Louis: I do yoga at home every day, and I follow a low-fat diet. 
d. Louis: You look awesome. What do you do to keep fit? 
e. Louis: Absolutely! Physical well-being is essential for a happy life.', NULL, NULL, 11, 0.25, '2026-10-09 12:04:34.342298', '2026-10-09 12:04:34.342298');
INSERT INTO public.questions VALUES (14, 3, 'a. Mary: Thank you very much for your help! 
b. John: Well, keep straight on to the roundabout, then take the second exit on the left. It''s a big building with a red roof on your right. 
c. Mary: Excuse me, could you show me the way to the public library?', NULL, NULL, 12, 0.25, '2026-10-09 12:04:34.471305', '2026-10-09 12:04:34.471305');
INSERT INTO public.questions VALUES (15, 3, 'a. This occasion, as a result, has made me more grateful to farmers and helped me understand what the saying "no pain, no gain" practically means. 
b. It had, in fact, never occurred to me that farming would be so physically demanding.
c. I had to do the land ploughing, fertiliser spreading and grass uprooting in the buring summer heat d. Having hands-on experience on a farm for a fortnight really exhausted me, but at the same time made me more appreciative of farming.
e. Farming was such hard work that it made me sweat all the time and even lose a few kilos.', NULL, NULL, 13, 0.25, '2026-10-09 12:04:34.599556', '2026-10-09 12:04:34.599556');
INSERT INTO public.questions VALUES (16, 3, 'Dear Mr Smith,
a. In case you have not received your chip-based card, contact our Customer Service at 0123247247. 
b. This will automatically deactivate your magnetic stripe card, which can then be safely destroyed by your cutting it in half. 
c. Your current magnetic stripe card expires on August 31, whether the chip-based one is activated. 
d. Should you have received the chip-based credit card, please use it Instantly. 
e. We would like to inform you that due to our operating system conversion, your magnetic stripe credit card has been replaced with a chip-based one, which has been on delivery to you. 
Yours sincerely, 
XYZ Bank', NULL, NULL, 14, 0.25, '2026-10-09 12:04:34.727668', '2026-10-09 12:04:34.727668');
INSERT INTO public.questions VALUES (17, 4, 'According to paragraph 1, genuine decarbonisation $\underline{\text{\placeholder{   }}}$', 'exam-media/gv_17/46463712-c965-485a-877d-b2e30ed8e95e/1792f300-0a54-4957-ad21-b32a9206cdc5.png', NULL, 1, 0.25, '2026-10-09 12:04:34.855758', '2026-10-09 12:04:34.855758');
INSERT INTO public.questions VALUES (18, 4, 'Which of the following best summarises paragraph 1 ?', NULL, NULL, 2, 0.25, '2026-10-09 12:04:34.983875', '2026-10-09 12:04:34.983875');
INSERT INTO public.questions VALUES (19, 4, 'Which of the following is NOT stated as an example of greenwashed products or services ?', NULL, NULL, 3, 0.25, '2026-10-09 12:04:35.112192', '2026-10-09 12:04:35.112192');
INSERT INTO public.questions VALUES (20, 4, 'The word $\underline{\text{glossy}}$ in paragraph 2 mostly means', NULL, NULL, 4, 0.25, '2026-10-09 12:04:35.24061', '2026-10-09 12:04:35.24061');
INSERT INTO public.questions VALUES (21, 4, 'The word $\underline{\text{They}}$ in paragraph 2 refers to', NULL, NULL, 5, 0.25, '2026-10-09 12:04:35.371228', '2026-10-09 12:04:35.371228');
INSERT INTO public.questions VALUES (22, 4, 'Which of the following best paraphrases the underlined sentence in paragraph 3 ?', NULL, NULL, 6, 0.25, '2026-10-09 12:04:35.499323', '2026-10-09 12:04:35.499323');
INSERT INTO public.questions VALUES (23, 4, 'According to the passage, the adoption of "green" paint by fossil-fuel companies is mentioned as', NULL, NULL, 7, 0.25, '2026-10-09 12:04:35.627206', '2026-10-09 12:04:35.627206');
INSERT INTO public.questions VALUES (24, 4, 'Which of the following can be inferred from the passage?', NULL, NULL, 8, 0.25, '2026-10-09 12:04:35.755046', '2026-10-09 12:04:35.755046');
INSERT INTO public.questions VALUES (25, 4, 'Where in the passage does the following sentence best fit? 
Yet greenwashing is arguably more Insidious.', NULL, NULL, 9, 0.25, '2026-10-09 12:04:35.883719', '2026-10-09 12:04:35.883719');
INSERT INTO public.questions VALUES (26, 4, 'Which of the following best summarises the passage ?', NULL, NULL, 10, 0.25, '2026-10-09 12:04:36.015328', '2026-10-09 12:04:36.015328');
INSERT INTO public.questions VALUES (27, 5, '$\underline{\text{Read the following announcement and mark the letter A, B, C or D on your answer sheet to Indicate the option that best fits each of the numbered blanks from 29 to 34. }}$
   Vietnam International Art Exhibition 2025-A Landmark Cultural Event
Taking place from July 25 to 29th at the International Centre for Exhibition in Hanoi, the Vietnam International Art Exhibition 2025 will showcase over 100 famous galleries (29) $\underline{\text{\placeholder{     }}}$ are derived from global art capitals alongside Vietnam''s (30) $\underline{\text{\placeholder{     }}}$ art institutions. Visitors will gain exposure to a wide (31) $\underline{\text{\placeholder{     }}}$ of oil paintings, sculptures, digital art, and mixed media, blending traditional and contemporary styles. The event will also feature live art demonstrations and insightful discussions (32) $\underline{\text{\placeholder{     }}}$ by famous artists and curators, offering a deeper understanding of modem artistic trends. This exhibition is a unique opportunity for (33) $\underline{\text{\placeholder{     }}}$ investors, and art enthusiasts to discover emerging talents and (34) $\underline{\text{\placeholder{     }}}$ some artworks. Don''t miss this incredible celebration of artistic expression !
For more information, visit https://vniae.com/', NULL, NULL, 1, 1.50, '2026-10-09 12:04:36.146854', '2026-10-09 12:04:36.146854');
INSERT INTO public.questions VALUES (28, 6, '$\underline{\text{Read the following leaflet and mark the letter A, B, C or D on your answer sheet to Indicate the option that best fits each of the numbered blanks from 35 to 40. }}$
     How to Live Your Life Actively?
If you are not naturally sporty, and finding ways to fit more activity into your daily life, here are several tips to help you make a routine (35) $\underline{\text{\placeholder{    }}}$ being active: 
• Select a realistic exercise plan. 
• Track your progress using a health app (36) $\underline{\text{\placeholder{    }}}$ a paper checklist
• Take every opportunity to do such strength-building activities as carrying (37) $\underline{\text{\placeholder{    }}}$ and climbing the stairs
• Invite friends and (38) $\underline{\text{\placeholder{    }}}$ family members to join in, and try (39) $\underline{\text{\placeholder{    }}}$ everyone''s competitive side with challenges like seeing who can do the most steps or cover the most distance in a day
• Reward yourself with a treat like a favourite TV show if your plan works (40) $\underline{\text{\placeholder{    }}}$ to maintain your motivation', NULL, NULL, 1, 1.50, '2026-10-09 12:04:36.277345', '2026-10-09 12:04:36.277345');
INSERT INTO public.questions VALUES (32, 7, 'Cho hình chóp S.ABC có đáy là tam giác vuông tại B, AB = a, BC = a$\sqrt2$, SA vuông góc với mặt phẳng đáy và SA = a (tham khảo hình bên). Góc giữa đường thẳng SC và mặt phẳng đáy bằng', NULL, NULL, 4, 0.45, '2026-10-09 13:11:26.316842', '2026-10-09 13:11:26.316842');
INSERT INTO public.questions VALUES (33, 7, 'Cho a và b là hai số thực dương thỏa mãn $9^{\log_3\left(a^2b\right)}$ = $4a^3$.  Giá trị của $ab^2$ bằng', NULL, NULL, 5, 0.45, '2026-10-09 13:11:26.458016', '2026-10-09 13:11:26.458016');
INSERT INTO public.questions VALUES (34, 7, 'Cho hàm số y = f(x) liên tục trên R có bảng xét dấu đạo hàm $f^{\prime}({}x)$  như sau. Mệnh đề nào dưới đây đúng?', 'exam-media/gv_17/391ce795-1033-4335-ade4-eab1d191f106/83a1229c-ecb8-42a2-b051-6e9b6d8795fd.png', NULL, 6, 0.45, '2026-10-09 13:11:26.599108', '2026-10-09 13:11:26.599108');
INSERT INTO public.questions VALUES (35, 7, 'Tập nghiệm của bất phương trình $\log_2\left(x-5\right)$ $\leq$ 4 chứa bao nhiêu số nguyên.', NULL, NULL, 7, 0.45, '2026-10-09 13:11:26.739934', '2026-10-09 13:11:26.739934');
INSERT INTO public.questions VALUES (36, 7, 'Hệ số góc của tiếp tuyến với đồ thị hàm số y = x$\ln({}x)$ tại điểm có hoành độ x = $e$ bằng', NULL, NULL, 8, 0.45, '2026-10-09 13:11:26.88108', '2026-10-09 13:11:26.88108');
INSERT INTO public.questions VALUES (40, 7, 'Cho hai biến cố A và B với $P(A)$ = 0,5 và $P(B)$ = 0,4 và $P(AB)$ = 0,3. Xác suất để A hoặc B xảy ra bằng', NULL, NULL, 12, 0.45, '2026-10-09 13:11:27.448771', '2026-10-09 13:11:27.448771');
INSERT INTO public.questions VALUES (45, 9, 'Cho hàm số y = $x^3$ - 3$x^2$ có đồ thị (C). Tiếp tuyến với đồ thị (C) tại điểm M(1; −2) cắt Ox, Oy lần lượt tại A, B. Tính diện tích tam giác OAB (làm tròn đến hàng phần trăm)', NULL, NULL, 1, 0.45, '2026-10-09 13:11:28.157096', '2026-10-09 13:11:28.157096');
INSERT INTO public.questions VALUES (46, 9, 'Hàm số y = $\sqrt{3x-x^2}$ đồng biến trên khoảng có độ dài lớn nhất là (a; b). Tính giá trị của $a^3+4b^2$', NULL, NULL, 2, 0.45, '2026-10-09 13:11:28.301268', '2026-10-09 13:11:28.301268');
INSERT INTO public.questions VALUES (47, 9, 'Cho hình lăng trụ đứng ABC. A''B''C'' có tất cả các cạnh bằng 1. Gọi M là trung điểm của AA''. Tính khoảng cách từ M đến mặt phẳng (AB''C) (làm tròn đến hàng phần trăm)', NULL, NULL, 3, 0.45, '2026-10-09 13:11:28.443042', '2026-10-09 13:11:28.443042');
INSERT INTO public.questions VALUES (48, 9, 'Sự tăng trưởng của một loại vi khuẩn trong môi trường nuôi cấy tuân theo công thức N = $N_0e^{rt}$, trong đó N0 là số lượng vi khuẩn ban đầu, r là tỉ lệ tăng trưởng (r > 0), t (giờ) là thời gian tăng trưởng. Biết rằng số lượng vi khuẩn ban đầu là 200 con và sau 3 giờ có 1 000 con. Hỏi sau bao lâu thì số lượng vi khuẩn đạt được 4 000 con (làm tròn kết quả đến hàng phần chục)', NULL, NULL, 4, 0.45, '2026-10-09 13:11:28.584272', '2026-10-09 13:11:28.584272');
INSERT INTO public.questions VALUES (29, 7, 'Cho cấp số nhân () $u_{n}$ với $u_{1}$ = 4 và công bội q = 3. Giá trị của $u_{2}$ bằng', NULL, NULL, 1, 0.44, '2026-10-09 13:11:25.876554', '2026-10-10 04:18:21.983525');
INSERT INTO public.questions VALUES (51, 10, 'Nghiệm của phương trình $3^{2x+5}$ = 27 là', NULL, NULL, 1, 0.44, '2026-10-10 04:15:47.108116', '2026-10-10 04:15:47.108116');
INSERT INTO public.questions VALUES (52, 10, 'Có bao nhiêu giá trị nguyên của tham số m để hàm số f(x) = $\frac13x^3+mx^2+4x+3$ đồng biến trên R', NULL, NULL, 2, 0.44, '2026-10-10 04:15:47.257193', '2026-10-10 04:15:47.257193');
INSERT INTO public.questions VALUES (53, 10, 'Cho khối chóp có diện tích đáy bằng $3a^2$, chiều cao bằng 2a. Thể tích khối chóp đó bằng', NULL, NULL, 3, 0.45, '2026-10-10 04:15:47.392629', '2026-10-10 04:15:47.392629');
INSERT INTO public.questions VALUES (54, 10, 'Cho hàm số y = f(x) xác định trên R và có bảng xét dấu đạo hàm như hình vẽ bên dưới.', 'exam-media/gv_17/79c2c725-ebd8-4d9f-a595-72e1ecced22d/63b3eb7e-10b1-4105-b26e-1d27d971d41f.png', NULL, 4, 0.45, '2026-10-10 04:15:47.528384', '2026-10-10 04:15:47.528384');
INSERT INTO public.questions VALUES (55, 10, 'Điểm cực trị của hàm số y = $\frac12x^4-2x^2-3$ là', NULL, NULL, 5, 0.45, '2026-10-10 04:15:47.663796', '2026-10-10 04:15:47.663796');
INSERT INTO public.questions VALUES (56, 10, 'Cho hình chóp đều S.ABCD, gọi O là giao điểm của AC và BD. Phát biểu nào sau đây là sai?', NULL, NULL, 6, 0.45, '2026-10-10 04:15:47.800273', '2026-10-10 04:15:47.800273');
INSERT INTO public.questions VALUES (57, 10, 'Cho hàm số y = f(x) có bảng biến thiên như sau 
Hàm số đã cho đồng biến trên khoảng nào?', 'exam-media/gv_17/79c2c725-ebd8-4d9f-a595-72e1ecced22d/825321da-72da-4a9b-896a-966f7718c3bc.png', NULL, 7, 0.45, '2026-10-10 04:15:47.93591', '2026-10-10 04:15:47.93591');
INSERT INTO public.questions VALUES (58, 10, 'Cho hình lập phương ABCD.A''B''C''D'', góc giữa hai đường thẳng A''B và B''C bằng', NULL, NULL, 8, 0.45, '2026-10-10 04:15:48.071734', '2026-10-10 04:15:48.071734');
INSERT INTO public.questions VALUES (59, 10, 'Tích vô hướng của hai vectơ $\overrightarrow{a}$ và $\overrightarrow{b}$ trong không gian được tính bằng', NULL, NULL, 9, 0.45, '2026-10-10 04:15:48.207366', '2026-10-10 04:15:48.207366');
INSERT INTO public.questions VALUES (60, 10, 'Hàm số f(x) có đạo hàm $f^{\prime}({}x)$ = $x^2\left(x+1\right)\left(x-2\right)^3$, $\forall a\in R$. Hỏi f(x) có bao nhiêu điểm cực đại?', NULL, NULL, 10, 0.45, '2026-10-10 04:15:48.343035', '2026-10-10 04:15:48.343035');
INSERT INTO public.questions VALUES (61, 10, 'Cho hình lập phương ABCD. A''B''C''D'' với AB = 4. Giá trị của $\left|\overrightarrow{AB}+\overrightarrow{B^{\prime}C^{\prime}}+\overrightarrow{AA^{\prime}}\right|$ là', NULL, NULL, 11, 0.45, '2026-10-10 04:15:48.478312', '2026-10-10 04:15:48.478312');
INSERT INTO public.questions VALUES (62, 10, 'Cho hàm số y = f(x) có đạo hàm $f^{\prime}({}x)$ = x + 1 với mọi x $\in$ R. Hàm số đã cho nghịch biến trên khoảng nào dưới đây?', NULL, NULL, 12, 0.45, '2026-10-10 04:15:48.615039', '2026-10-10 04:15:48.615039');
INSERT INTO public.questions VALUES (63, 11, 'Cho hàm số f(x) = $\left(x^2-3x-3\right)e^{x}$', NULL, NULL, 1, 0.48, '2026-10-10 04:15:48.752961', '2026-10-10 04:15:48.752961');
INSERT INTO public.questions VALUES (64, 11, 'Cho hình chóp tứ giác S.ABCD có đáy ABCD là hình vuông cạnh 2a, SA = a, SB = $a\sqrt3$, (SAB) $\perp$ (ABCD). Gọi H là hình chiếu vuông góc của S trên AB.', NULL, NULL, 2, 0.48, '2026-10-10 04:15:48.888236', '2026-10-10 04:15:48.888236');
INSERT INTO public.questions VALUES (65, 11, 'Cho hàm số y = f(x) = $\sqrt{-x^2+4x}$. Khi đó', NULL, NULL, 3, 0.48, '2026-10-10 04:15:49.023691', '2026-10-10 04:15:49.023691');
INSERT INTO public.questions VALUES (66, 11, 'Cho hàm số y = f(x) có bảng biến thiên', 'exam-media/gv_17/79c2c725-ebd8-4d9f-a595-72e1ecced22d/b94e9b5c-87e2-436b-8c30-fa4555b36519.png', NULL, 4, 0.48, '2026-10-10 04:15:49.159499', '2026-10-10 04:15:49.159499');
INSERT INTO public.questions VALUES (67, 12, 'Cho hàm số y = $\frac{mx+4m}{x+m}$ với m là tham số. Gọi S là tập hợp tất cả các giá trị nguyên của m để hàm số nghịch biến trên các khoảng xác định. Tìm số phần tử của S', NULL, NULL, 1, 0.45, '2026-10-10 04:15:49.29488', '2026-10-10 04:15:49.29488');
INSERT INTO public.questions VALUES (68, 12, 'Cho khối chóp S.ABCD có đáy ABCD là hình thang vuông tại A và B, AB = BC = 1, AD = 2. Hình chiếu vuông góc của S lên mặt phẳng đáy trùng với trung điểm H của AD và SH = $\frac{2\sqrt6}{3}$. Tính khoảng cách từ điểm B đến mặt phẳng (SCD) (kết quả làm tròn đến hàng phần trăm)', NULL, NULL, 2, 0.45, '2026-10-10 04:15:49.430308', '2026-10-10 04:15:49.430308');
INSERT INTO public.questions VALUES (69, 12, 'Bốn ngư dân góp vốn mua chung một chiếc thuyền. Số tiền người đầu đóng góp bằng nửa tổng số tiền của ba người còn lại. Số tiền người thứ hai đóng góp bằng $\frac13$ tổng số tiền cùa ba người cỏn lại. Số tiền người thứ ba đóng góp bằng $\frac14$ tổng số tiền cùa ba người còn lại. Biết người thứ tư đóng góp 130 triệu đồng. Chiếc thuyền này được mua bao nhiêu triệu đồng?', NULL, NULL, 3, 0.45, '2026-10-10 04:15:49.565991', '2026-10-10 04:15:49.565991');
INSERT INTO public.questions VALUES (70, 12, 'Một tấm sắt tròn được treo song song với mặt phẳng nằm ngang bởi ba sợi dây không giãn xuất phát từ điểm O trên trần nhà và lần lượt buộc vào ba điểm A, B, C trên tấm sắt tròn sao cho các lực căng $\overrightarrow{F_1}$, $\overrightarrow{F_2}$, $\overrightarrow{F_3}$ lần lượt trên mỗi dây OA, OB, OC đôi một vuông góc với nhau và có độ lớn bằng nhau, nghĩa là |$\overrightarrow{F_1}$| = |$\overrightarrow{F_2}$| = |$\overrightarrow{F_3}$|. Biết trọng lượng P của tấm sắt tròn đó bằng $2025\sqrt3$ (N) và tam giác ABC đều. Tính lực căng của mỗi sợi dây treo tấm sắt tròn đó.', NULL, NULL, 4, 0.45, '2026-10-10 04:15:49.701324', '2026-10-10 04:15:49.701324');
INSERT INTO public.questions VALUES (71, 12, 'Giả sử doanh thu bán hàng (đơn vị triệu đồng) của một sản phẩm điện tử mới được mô hình hóa bằng hàm số f(t) = $700\left(t^2+me^{-t}\right)$ với t $\geq$ 0 là thời gian tính bằng năm kể từ khi phát hành sản phẩm mới, và m $\leq$ 0 là tham số. Khi đó đạo hàm $f^{\prime}(t{})$ biểu thị tốc độ bán hàng. Biết rằng tốc độ bán hàng luôn tăng trong khoảng thời gian 8 năm đầu từ khi ra mắt sản phẩm (0 $\leq$ t $\leq$ 8). Hỏi giá trị nhỏ nhất của m là bao nhiêu để điều kiện này được thỏa mãn?', NULL, NULL, 5, 0.45, '2026-10-10 04:15:49.837117', '2026-10-10 04:15:49.837117');
INSERT INTO public.questions VALUES (72, 12, 'Hiệu quả nhiên liệu E, tính bằng số kilômét đi được trên mỗi lít xăng km/l của một mẫu xe ô tô được mô hình hoá theo tốc độ v km/h bằng công thức sau: E(v) = 0,000 02$v^3$ + 0,002 25$v^2$+ 14,7. Mô hình này được áp dụng cho các tốc độ v từ 20 km/h đến 120 km/h (20 $\leq$ v $\leq$ 120). Từ bảng biến thiên của hàm số y = E(v) trên đoạn [20; 120] hãy tìm giá trị nhiên liệu hiệu quả nhất (tức là giá trị lớn nhất của E(v), làm tròn kết quả đến hàng phần mười)', NULL, NULL, 6, 0.45, '2026-10-10 04:15:49.972569', '2026-10-10 04:15:49.972569');
INSERT INTO public.questions VALUES (30, 7, 'Cho hàm số y = f(x) = $x^{3}$ + 2x+ $\cos({}x)$. Phát biểu nào sau đây là đúng.', NULL, NULL, 2, 0.44, '2026-10-09 13:11:26.034376', '2026-10-10 04:18:21.98354');
INSERT INTO public.questions VALUES (31, 7, 'Có bao nhiêu cách xếp 8 học sinh thành một hàng dọc?', NULL, NULL, 3, 0.45, '2026-10-09 13:11:26.175591', '2026-10-10 04:18:21.983565');
INSERT INTO public.questions VALUES (37, 7, 'Cho hình hộp chữ nhật ABCD. A''B''C''D'' có AB = 3; AD = 4; AA'' =12. Độ dài của vectơ  = $\overrightarrow{v}$ = $\overrightarrow{AB}$ + $\overrightarrow{AD}$ + $\overrightarrow{AA^{\prime}}$ bằng', NULL, NULL, 9, 0.45, '2026-10-09 13:11:27.023103', '2026-10-10 04:18:21.983602');
INSERT INTO public.questions VALUES (38, 7, 'Cho khối chóp có diện tích đáy B = 3, chiều cao h = 8. Thể tích của khối chóp đã cho bằng', NULL, NULL, 10, 0.45, '2026-10-09 13:11:27.166552', '2026-10-10 04:18:21.983611');
INSERT INTO public.questions VALUES (39, 7, 'Cho hàm số y = f(x) có đạo hàm trên R và đồ thị hàm số $f^{\prime}({}x)$ trên [2;-2] như hình sau. Hàm số f(x) đã cho đồng biến trên khoảng nào dưới đây?', 'exam-media/gv_17/391ce795-1033-4335-ade4-eab1d191f106/84697441-8b27-47af-a8bd-72d15657ae2d.png', NULL, 11, 0.45, '2026-10-09 13:11:27.308004', '2026-10-10 04:18:21.983621');
INSERT INTO public.questions VALUES (41, 8, 'Một chất điểm bắt đầu chuyển động trên trục x''Ox với phương trình chuyển động x(t) = $t^4-3t^2+2t$ (mét) với t là thời gian tính bằng giây kể từ lúc bắt đầu chuyển động.', NULL, NULL, 1, 0.48, '2026-10-09 13:11:27.589818', '2026-10-10 04:18:21.983631');
INSERT INTO public.questions VALUES (42, 8, 'Cho hình lập phương ABCD. A''B''C''D'' cạnh a', NULL, NULL, 2, 0.48, '2026-10-09 13:11:27.731022', '2026-10-10 04:18:21.983639');
INSERT INTO public.questions VALUES (43, 8, 'Cho hình chóp S.ABCD có đáy ABCD là hình thang vuông tại A, B và AD = 2BC = 2AB, SD = $a\sqrt5$. Tam giác SAB đều và nằm trong mặt phẳng vuông góc với đáy.', NULL, NULL, 3, 0.48, '2026-10-09 13:11:27.872158', '2026-10-10 04:18:21.983649');
INSERT INTO public.questions VALUES (44, 8, 'Chọn một số tự nhiên từ 100 số nguyên dương đầu tiên', NULL, NULL, 4, 0.48, '2026-10-09 13:11:28.013539', '2026-10-10 04:18:21.983657');
INSERT INTO public.questions VALUES (49, 9, 'Cho hình chóp S.ABCD có đáy ABCD là hình bình hành và SA = SB = SC = AC = 6. Góc hợp bởi đường thẳng SB và mặt phẳng (SAC) bằng 60$^\circ$. Tính thể tích khối chóp S.ABCD', NULL, NULL, 5, 0.45, '2026-10-09 13:11:28.725794', '2026-10-10 04:18:21.983686');
INSERT INTO public.questions VALUES (50, 9, 'Một hộp đựng k (k $\leq$ 15) chiếc bút đỏ và 15 chiếc bút đen. Một người lấy ra ngẫu nhiên từ hộp mỗi lần một chiếc bút cho đến khi lấy được chiếc bút đỏ thì dừng lại. Biết rằng xác suất để người đó dừng lại ở lần 2 là $\frac{5}{22}$, tính xác suất để người đó dừng lại ở lần thứ 3. (làm tròn kết quả đến hàng phần trăm)', NULL, NULL, 6, 0.45, '2026-10-09 13:11:28.871048', '2026-10-10 04:18:21.983696');
INSERT INTO public.questions VALUES (73, 13, 'Hàm số nào sau đây nghịch biến trên R?', NULL, NULL, 1, 0.44, '2026-10-10 05:18:52.342591', '2026-10-10 05:18:52.342591');
INSERT INTO public.questions VALUES (74, 13, 'Cho hàm số y = f(x) liên tục trên đoạn [−2; 4] và có đồ thị như hình vẽ bên. Tổng giá trị lớn nhất và giá trị nhỏ nhất của hàm số đã cho trên đoạn [−2; 4] bằng', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/df82180e-d665-4ac6-96b7-36296ddacac9.png', NULL, 2, 0.44, '2026-10-10 05:18:52.478016', '2026-10-10 05:18:52.478016');
INSERT INTO public.questions VALUES (75, 13, 'Cho hình lập phương ABCD.A''B''C''D''. Khẳng định nào sau đây là khẳng định sai?', NULL, NULL, 3, 0.45, '2026-10-10 05:18:52.609756', '2026-10-10 05:18:52.609756');
INSERT INTO public.questions VALUES (76, 13, 'Cho hình hộp ABCD.EFGH. Vectơ nào sau đây bằng vectơ $\overrightarrow{FH}$', NULL, NULL, 4, 0.45, '2026-10-10 05:18:52.741153', '2026-10-10 05:18:52.741153');
INSERT INTO public.questions VALUES (77, 13, 'Trong không gian với hệ tọa độ Oxyz, với $\overrightarrow{i},\overrightarrow{j},\overrightarrow{k}$ là các vectơ đơn vị trên trục Ox, Oy, Oz tương ứng và vectơ $\overrightarrow{a}$=(1; 0; 1). Kết quả nào sau đây đúng?', NULL, NULL, 5, 0.45, '2026-10-10 05:18:52.872379', '2026-10-10 05:18:52.872379');
INSERT INTO public.questions VALUES (78, 13, 'Cho hình chóp S.ABCD có đáy ABCD là hình bình hành tâm O. Tổng $\overrightarrow{SA}+\overrightarrow{SB}+\overrightarrow{SC}+\overrightarrow{SD}$ bằng', NULL, NULL, 6, 0.45, '2026-10-10 05:18:53.003581', '2026-10-10 05:18:53.003581');
INSERT INTO public.questions VALUES (79, 13, 'Giá trị nhỏ nhất của hàm số f(x) = $x^3-3x+2$ trên đoạn [−3; 3] bằng', NULL, NULL, 7, 0.45, '2026-10-10 05:18:53.134592', '2026-10-10 05:18:53.134592');
INSERT INTO public.questions VALUES (80, 13, 'Trong không gian với hệ trục tọa độ Oxyz, cho vectơ $\overrightarrow{u}=\overrightarrow{j}-4\overrightarrow{k}$. Toạ độ của vectơ $\overrightarrow{u}$ là', NULL, NULL, 8, 0.45, '2026-10-10 05:18:53.265598', '2026-10-10 05:18:53.265598');
INSERT INTO public.questions VALUES (81, 13, 'Cho hàm số y = $ax^3+bx^2+cx+d$ ( a,b,c,d $\in$ R) có đồ thị trên R là đường cong trong hình bên. Giá trị cực đại của hàm số đã cho bằng', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/bab33590-dc78-4154-86a0-9dfada117748.png', NULL, 9, 0.45, '2026-10-10 05:18:53.396938', '2026-10-10 05:18:53.396938');
INSERT INTO public.questions VALUES (82, 13, 'Cho hình chóp SABCD, có đáy ABCD là hình bình hành tâm O. Tam giác SAC đều cạnh bằng a. Khi đó $\left|\overrightarrow{SB}+\overrightarrow{SD}\right|$bằng', NULL, NULL, 10, 0.45, '2026-10-10 05:18:53.528154', '2026-10-10 05:18:53.528154');
INSERT INTO public.questions VALUES (83, 13, 'Cho hình lập phương ABCD.A''B''C''D''có cạnh bằng a. Khẳng định nào sau đây là đúng?', NULL, NULL, 11, 0.45, '2026-10-10 05:18:53.65939', '2026-10-10 05:18:53.65939');
INSERT INTO public.questions VALUES (84, 13, 'Cho hàm số y = f(x) xác định trên R và có bảng biến thiên như sau. Hàm số y = f(x) nghịch biến trên khoảng nào dưới đây?', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/3234d17f-201a-4858-b8f0-66360138c259.png', NULL, 12, 0.45, '2026-10-10 05:18:53.790258', '2026-10-10 05:18:53.790258');
INSERT INTO public.questions VALUES (85, 14, 'Cho hàm số y = f(x) có đồ thị $f^{\prime}({}x)$ là parabol như hình vẽ. Xét tính đúng sai của mỗi khẳng định sau:', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/a2dc90e8-110e-4c11-b67e-bdf3fd031dcb.png', NULL, 1, 0.48, '2026-10-10 05:18:53.921033', '2026-10-10 05:18:53.921033');
INSERT INTO public.questions VALUES (86, 14, 'Cho tứ diện ABCD. Gọi M, N lần lượt là trung điểm của các cạnh AD và BC, I là trung điểm MN. Xét tính đúng sai của các khẳng định sau:', NULL, NULL, 2, 0.48, '2026-10-10 05:18:54.057989', '2026-10-10 05:18:54.057989');
INSERT INTO public.questions VALUES (87, 14, 'Cho hàm số y = f(x) có bảng biến thiên như hình vẽ bên dưới. Xét tính đúng sai của các khẳng định sau', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/cb74af92-1817-4abc-8241-3ddd41d49151.png', NULL, 3, 0.48, '2026-10-10 05:18:54.188983', '2026-10-10 05:18:54.188983');
INSERT INTO public.questions VALUES (88, 14, 'Cho hình hộp ABCD.A''B''C''D'', gọi G là trọng tâm tam giác A''BD và M là trung điểm CD. Biết $\widehat{A^{\prime}AC}$ = 120$^\circ$, $\widehat{A^{\prime}AB}$ = 60$^\circ$, $\widehat{BAC}$= 90$^\circ$, AB = AC = 2, AA'' = 1. Các khẳng định sau đây đúng hay sai?', NULL, NULL, 4, 0.48, '2026-10-10 05:18:54.320189', '2026-10-10 05:18:54.320189');
INSERT INTO public.questions VALUES (89, 15, 'Gọi $y_{1,}y_2$ lần lượt là giá trị cực đại và giá trị cực tiểu của hàm số y = $\frac{x^2+3x+3}{x+2}$. Giá trị của biểu thức $y_1^2-2y_2^2$ bằng bao nhiêu?', NULL, NULL, 1, 0.45, '2026-10-10 05:18:54.451321', '2026-10-10 05:18:54.451321');
INSERT INTO public.questions VALUES (90, 15, 'Để giảm nhiệt độ trong các phòng học từ nhiệt độ ban đầu là 28$^\circ$C, một hệ thống điều hòa làm mát được phép hoạt động trong 10 phút. Gọi T (đơn vị $^\circ$C) là nhiệt độ phòng ở phút thứ t (tính từ thời điểm bật máy) được cho bởi công thức T = 0,008$t^3$ - 1,536t + 28 (t $\in$[0; 10]). Nhiệt độ thấp nhất trong phòng có thể đạt được trong khoảng thời gian 10 phút đó bằng bao nhiêu độ? (Kết quả làm tròn đến hàng phần mười)', NULL, NULL, 2, 0.45, '2026-10-10 05:18:54.582284', '2026-10-10 05:18:54.582284');
INSERT INTO public.questions VALUES (91, 15, 'Biết đồ thị hàm số y = $x^3+3x^2-9x-1$ có hai cực trị A và B. Phương trình đường thẳng AB là y = ax + b (a, b $\in$ R). Tính tổng a + b', NULL, NULL, 3, 0.45, '2026-10-10 05:18:54.713104', '2026-10-10 05:18:54.713104');
INSERT INTO public.questions VALUES (92, 15, 'Cho hình chóp S.ABCD có đáy ABCD là hình bình hành và mặt bên SAB là tam giác đều. Góc giữa hai vectơ $\overrightarrow{DC}$ và $\overrightarrow{BS}$ bằng bao nhiêu độ?', NULL, NULL, 4, 0.45, '2026-10-10 05:18:54.84393', '2026-10-10 05:18:54.84393');
INSERT INTO public.questions VALUES (93, 15, 'Giả sử chi phí tiền xăng C (đồng) phụ thuộc tốc độ trung bình v (km/h) theo công thức: C(v) = $\frac{16000}{v}+\frac{5v}{2}$ (0 < v $\leq$ 120). Để biểu diễn trực quan sự thay đổi của C(v) theo v, người ta đã vẽ đồ thị hàm số C(v) như hình bên dưới. Tài xế xe tải lái xe với tốc độ trung bình là bao nhiêu (đơn vị km/h) để tiết kiệm tiền xăng nhất?', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/cb301cfd-c63c-425c-a387-04829fd620df.png', NULL, 5, 0.45, '2026-10-10 05:18:54.977496', '2026-10-10 05:18:54.977496');
INSERT INTO public.questions VALUES (94, 15, 'Cho mảnh giấy hình bán nguyệt có đường kính là đoạn thẳng AB có độ dài bằng 2. Trên cung AB lấy một điểm P. Gấp mảnh giấy theo nếp gấp là đoạn thẳng AP sao cho hai phần giấy khít lên nhau. Khi $\widehat{PAB}$ = $\phi$(0< $\phi$< $\frac{\pi}{4}$) , gọi S($\phi$) là diện tích phần giấy bị chồng lên nhau. Giả sử S($\phi$) đạt giá trị lớn nhất tại $\phi$ =   $\alpha$. Hỏi giá trị của cos $\alpha$ là bao nhiêu? (làm tròn kết quả đến hàng phần trăm)', 'exam-media/gv_17/f4a1c73f-7860-463f-a6b5-139b5599b95f/bf264d05-925b-4b19-94e3-c77cc65992d7.png', NULL, 6, 0.45, '2026-10-10 05:18:55.108407', '2026-10-10 05:18:55.108407');
INSERT INTO public.questions VALUES (95, 16, 'Cho hai biến cố A và B. Khẳng định nào sau đây luôn đúng?', NULL, NULL, 1, 0.44, '2026-10-10 09:12:26.179798', '2026-10-10 09:12:26.179798');
INSERT INTO public.questions VALUES (96, 16, 'Cho hình chóp tứ giác S.ABCD. Gọi M và N lần lượt là trung điểm của SB và SD. Khẳng định nào sau đây đúng?', NULL, NULL, 2, 0.44, '2026-10-10 09:12:26.332564', '2026-10-10 09:12:26.332564');
INSERT INTO public.questions VALUES (97, 16, 'Thời gian truy cập Internet mỗi buổi tối của một số học sinh được cho trong bảng sau.
Khoảng biến thiên của mẫu số liệu ghép nhóm là', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/162e3577-f6a1-4acb-a113-868620c3c933.png', NULL, 3, 0.45, '2026-10-10 09:12:26.469358', '2026-10-10 09:12:26.469358');
INSERT INTO public.questions VALUES (98, 16, 'Cho tứ diện ABCD. Gọi M, N lần lượt là trung điểm của BC, CD. Gọi G là trọng tâm của tam giác BCD. Khẳng định nào sau đây đúng?', NULL, NULL, 4, 0.45, '2026-10-10 09:12:26.606368', '2026-10-10 09:12:26.606368');
INSERT INTO public.questions VALUES (99, 16, 'Cho cấp số cộng ($u_{n}$) với $u_1$  = −1 và $u_2$ = 4. Giá trị của $u_{2025}$ bằng', NULL, NULL, 5, 0.45, '2026-10-10 09:12:26.742954', '2026-10-10 09:12:26.742954');
INSERT INTO public.questions VALUES (100, 16, 'Cho hàm số y = f(x) liên tục trên R và có bảng biến thiên như hình dưới đây.
Gọi M và m lần lượt là giá trị lớn nhất và nhỏ nhất của hàm số đã cho trên đoạn [−1; 3]. Giá trị của M + m bằng', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/971241f4-80c7-4fca-988a-5f2e409ed760.png', NULL, 6, 0.45, '2026-10-10 09:12:26.88055', '2026-10-10 09:12:26.88055');
INSERT INTO public.questions VALUES (101, 16, 'Tập nghiệm của phương trình $\log_{0,25}\left(x^2-3x\right)=-1$ là', NULL, NULL, 7, 0.45, '2026-10-10 09:12:27.017671', '2026-10-10 09:12:27.017671');
INSERT INTO public.questions VALUES (102, 16, 'Cho hàm số y = f(x) có bảng biến thiên như hình dưới đây. Mệnh đề nào sau đây là đúng?', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/af9f8197-bc9e-4c86-bbd9-5e21b0ebe907.png', NULL, 8, 0.45, '2026-10-10 09:12:27.154295', '2026-10-10 09:12:27.154295');
INSERT INTO public.questions VALUES (103, 16, 'Hình chiếu vuông góc của điểm A (2; 3; −1) trên mặt phẳng (Oyz) là điểm', NULL, NULL, 9, 0.45, '2026-10-10 09:12:27.290592', '2026-10-10 09:12:27.290592');
INSERT INTO public.questions VALUES (104, 16, 'Trong không gian với hệ tọa độ Oxyz, cho hai véc-tơ $\overrightarrow{x}$ = (2; 1; −3) và $\overrightarrow{y}$ = (1; 0; −1). Tìm tọa độ của véc-tơ $\overrightarrow{a}$ = $\overrightarrow{x}$ + 2$\overrightarrow{y}$', NULL, NULL, 10, 0.45, '2026-10-10 09:12:27.426917', '2026-10-10 09:12:27.426917');
INSERT INTO public.questions VALUES (105, 16, 'Cho hàm số y = f(x) liên tục trên R và có bảng xét dấu đạo hàm như hình vẽ. Số điểm cực trị của hàm số đã cho là', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/6383a0c1-f443-43cd-83ee-35b9c80c953d.png', NULL, 11, 0.45, '2026-10-10 09:12:27.563352', '2026-10-10 09:12:27.563352');
INSERT INTO public.questions VALUES (106, 16, 'Cho hàm số y = f(x) có có đồ thị của hàm số y = $f^{\prime}({}x)$ như hình vẽ bên. Hỏi hàm số y = f(x) có bao nhiêu điểm cực trị?', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/d7099729-9058-4067-9b2e-fc1118ac3a80.png', NULL, 12, 0.45, '2026-10-10 09:12:27.699722', '2026-10-10 09:12:27.699722');
INSERT INTO public.questions VALUES (107, 17, 'Cho tập dữ liệu mẫu $x_1$, $x_2$, ..., $x_6$; trong đó $x_1$ là giá trị nhỏ nhất, $x_6$ là giá trị lớn nhất. Suy ra', NULL, NULL, 1, 0.48, '2026-10-10 09:12:27.836196', '2026-10-10 09:12:27.836196');
INSERT INTO public.questions VALUES (108, 17, 'Cho hàm số f(x) = $2cosx+x$', NULL, NULL, 2, 0.48, '2026-10-10 09:12:27.973377', '2026-10-10 09:12:27.973377');
INSERT INTO public.questions VALUES (109, 17, 'Vấn đề ô nhiễm tiếng ồn càng ngày càng được quan tâm. Mức áp suất âm thanh là đại lượng được sử dụng để đo cường độ âm thanh. Mức áp suất âm thanh được tính bằng công thức $L_{P}$ = 20 × $\log_{}\left(\frac{p}{p_0}\right)$, trong đó hằng số ${p_0}$(${p_0}$> 0) là ngưỡng nghe tối thiểu (2 × $10_{}^{-5}$Pa trong không khí), p là áp suất âm thanh thực tế. Bảng sau cho biết mức áp suất âm thanh của các nguồn âm thanh khác nhau: 
Được biết, áp suất âm thanh thực tế đo được ở khoảng cách 10 m so với xe xăng, xe hybrid, xe điện lần lượt là $p_1,p_2,p_{_3}$.Từ đây suy ra:', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/3317b9c7-7f6b-498e-bb59-c8fd496ca1bc.png', NULL, 3, 0.48, '2026-10-10 09:12:28.110139', '2026-10-10 09:12:28.110139');
INSERT INTO public.questions VALUES (110, 17, 'Giả sử một mô hình tăng trưởng dân số của một thành phố được mô tả bởi hàm số: 
P(t) = $\frac{K}{1+Ae^{-rt}}$ (triệu người)
Trong đó: 
– P(t) là dân số tại thời điểm t (đơn vị năm),
– K là sức chứa tối đa của môi trường (dân số giới hạn),
– A > 0 là hằng số phụ thuộc dân số ban đầu, 
– r > 0 là tốc độ tăng trưởng. 
Hãy chọn phương án đúng/sai về mô hình này.', NULL, NULL, 4, 0.48, '2026-10-10 09:12:28.246804', '2026-10-10 09:12:28.246804');
INSERT INTO public.questions VALUES (111, 18, 'Cho lăng trụ ABC.A''B''C'' có đáy là tam giác đều, cạnh bên BB'' = 2 và vuông góc với đáy. Khoảng cách từ A đến mặt phẳng (A''BC) bằng $\frac{2\sqrt{57}}{19}$. Thể tích của lăng trụ là (làm tròn đến hàng phần trăm)', NULL, NULL, 1, 0.45, '2026-10-10 09:12:28.383181', '2026-10-10 09:12:28.383181');
INSERT INTO public.questions VALUES (112, 18, 'Phương trình đường thẳng đi qua hai điểm cực trị của đồ thị hàm số y = $\frac{x^2-3x+1}{2x+2}$ có dạng y = ax + b. Giá trị của a − 2b bằng', NULL, NULL, 2, 0.45, '2026-10-10 09:12:28.519666', '2026-10-10 09:12:28.519666');
INSERT INTO public.questions VALUES (113, 18, 'Hai người A và B cùng nhau chơi một trận đấu tennis diễn ra tối đa 5 sét đấu. Người nào thắng 3 sét trước sẽ thắng trận đấu. Biết xác suất giành chiến thắng mỗi sét của A là 0,4 (không có trận hòa). Tính xác suất để A là người thắng trận thi đấu tennis này (kết quả làm tròn đến hàng phần trăm)', NULL, NULL, 3, 0.45, '2026-10-10 09:12:28.656297', '2026-10-10 09:12:28.656297');
INSERT INTO public.questions VALUES (114, 18, 'Chất điểm M bị tác dụng bởi ba lực $\overrightarrow{F_1},\overrightarrow{F_2},\overrightarrow{F_3}$ có cường độ cùng bằng 4N. Góc tạo bởi hai trong ba lực lần lượt là 37$^\circ$, 48$^\circ$, 52$^\circ$. Người ta cần tác động vào M một lực có độ lớn bằng bao nhiêu để chất điểm M đạt trạng thái cân bằng (làm tròn đến hàng phần chục)', NULL, NULL, 4, 0.45, '2026-10-10 09:12:28.792955', '2026-10-10 09:12:28.792955');
INSERT INTO public.questions VALUES (115, 18, 'Một quả trứng khủng long đồ chơi bằng nhựa có thiết diện qua trục lớn là một đường elip. Biết độ dài mỗi trục là 12 cm và 8 cm. Bên trong quả trứng người ta cần thiết kế một chiếc hộp hình trụ để đựng các đồ chơi trẻ con như bóng đèn xanh đỏ, kẹo . . . Hỏi khối trụ như thế có thể tích tối đa bao nhiêu $\operatorname{\mathrm{cm}}^3$ (làm tròn đến hàng đơn vị)?', 'exam-media/gv_17/babf9c18-be60-4860-acfa-155319dd6f36/4c9b71cf-f279-47d5-8907-709fdcda9f84.png', NULL, 5, 0.45, '2026-10-10 09:12:28.931926', '2026-10-10 09:12:28.931926');
INSERT INTO public.questions VALUES (116, 18, 'Hai chiếc xe buýt đang di chuyển trên hai con đường cao tốc song song cách nhau 5 km, một chiếc đi về hướng đông với tốc độ 55 km/h và chiếc kia đi về hướng tây với tốc độ 60 km/h. Hãy tìm tốc độ thay đổi (km/h) của khoảng cách giữa hai chiếc xe buýt khi chúng cách nhau 13 km và đang tiến lại gần nhau (làm tròn đến hàng đơn vị).', NULL, NULL, 6, 0.45, '2026-10-10 09:12:29.069101', '2026-10-10 09:12:29.069101');


--
-- TOC entry 4278 (class 0 OID 18466)
-- Dependencies: 411
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.requests VALUES (2, 20, 8, 'JOIN_CLASS', 'APPROVED', 'Yêu cầu tham gia lớp Lớp toán học thêm', '', 'Yêu cầu tham gia lớp đã được chấp nhận', '2026-10-10 13:20:09.556251', '2026-10-10 13:20:38.04708', '2026-10-10 13:20:38.046219');
INSERT INTO public.requests VALUES (3, 20, 8, 'JOIN_CLASS', 'APPROVED', 'Yêu cầu tham gia lớp Lớp toán học thêm', '', 'Yêu cầu tham gia lớp đã được chấp nhận', '2026-10-10 13:31:05.532428', '2026-10-10 13:31:27.630806', '2026-10-10 13:31:27.630083');


--
-- TOC entry 4309 (class 0 OID 18974)
-- Dependencies: 442
-- Data for Name: student_answer_options; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4308 (class 0 OID 18950)
-- Dependencies: 441
-- Data for Name: student_answer_values; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4306 (class 0 OID 18916)
-- Dependencies: 439
-- Data for Name: student_answers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4267 (class 0 OID 17676)
-- Dependencies: 400
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.subjects VALUES (1, 'Toán', 'MATH', 'Môn Toán học');
INSERT INTO public.subjects VALUES (2, 'Tiếng Anh', 'ENGLISH', 'Môn Tiếng Anh');
INSERT INTO public.subjects VALUES (3, 'Vật lý', 'PHYSICS', 'Môn Vật lý');


--
-- TOC entry 4265 (class 0 OID 17607)
-- Dependencies: 398
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (4, 'admin', '$2a$10$WFY6sdnX8LPvW/GAkR5iNOSCjI70EHtIjOOLZHUtdrzdZ/uQSaXDG', 'admin@gmail.com', 'Lê Ngọc Anh Huy', '0586785275', NULL, 'ADMIN', 'ACTIVE', NULL, '2026-09-29 00:32:31.309278', '2026-09-29 00:32:31.309278', NULL);
INSERT INTO public.users VALUES (5, 'nguyenvana', '$2a$10$xP.pntLeSV7AvraEJzsGSepz.XXcrzrxuKjxsTXgKAzM0z946Z4f.', 'user@example.com', 'Nguyễn Văn A', '123456789', NULL, 'STUDENT', 'ACTIVE', NULL, '2026-09-29 00:46:27.682581', '2026-09-29 00:46:27.682581', NULL);
INSERT INTO public.users VALUES (7, 'haodeptrai', '$2a$10$JaTem3E5msZDyXpdvZ.W1edJmSMJqT0wPOLFn0dODUOa9UWu8En8u', 'user3@example.com', 'string', '0', 'string', 'TEACHER', 'PENDING', NULL, '2026-09-29 01:03:06.873325', '2026-09-29 01:03:06.873325', NULL);
INSERT INTO public.users VALUES (11, 'anhkhoa', '$2a$10$ruLK5l66mJR/SQir1/n/KeGkXn8QmeSnOiJ1C3cMR72ULqRY0C.Oq', 'anhkhoa@gmail.com', 'Nguyễn Anh Khoa', '2346174839', NULL, 'TEACHER', 'ACTIVE', NULL, '2026-09-30 14:17:38.683732', '2026-10-01 16:43:32.168629', NULL);
INSERT INTO public.users VALUES (9, 'dangxuanbao', '$2a$10$R.urZSuVvGLIg.tMa2dkye8DzpjfJykf0mJsJfwMHjcD0pwGUBtp.', 'xuanbao@gmail.co', 'Đặng Xuân Bảo', '123456780', '', 'TEACHER', 'ACTIVE', NULL, '2026-09-29 12:28:08.430328', '2026-09-29 12:28:08.430328', NULL);
INSERT INTO public.users VALUES (6, 'nguyenvanb', '$2a$10$.KmLwTijDUgxx9ZnQo1M2esL3t5dfVTwRTA7jwm50a4JCvR6liCRS', 'userb@example.com', 'string', 'string', NULL, 'TEACHER', 'ACTIVE', NULL, '2026-09-29 00:51:42.816623', '2026-09-29 00:51:42.816623', NULL);
INSERT INTO public.users VALUES (15, 'honghai', '$2a$10$IEMJgBgAY0wJNoUecWnCGuwwbaI793QEtUN5SplOq8LuXHjyZg8Oi', 'honghai@gmail.com', 'Phạm Hồng Hải', '1234567893', '', 'TEACHER', 'PENDING', NULL, '2026-10-02 04:43:23.465731', '2026-10-02 04:43:23.606401', 'TC-15');
INSERT INTO public.users VALUES (2, 'giaobao', '$2a$12$N9.hO.6W0y9wE1jP.3yP4.u7u/Q5Z.6qR9u7u/Q5Z.6qR9u7u/Q5Z', 'tranducbo@school.edu.vn', 'Nguyễn Hoàng Gia Bảo', '0988223344', 'https://ui-avatars.com/api/?name=Tran+Duc+Bo', 'STUDENT', 'ACTIVE', '3122410142', '2026-09-28 07:41:25.207629', '2026-09-28 07:41:25.207629', NULL);
INSERT INTO public.users VALUES (3, 'minhquan', '$2a$12$N9.hO.6W0y9wE1jP.3yP4.u7u/Q5Z.6qR9u7u/Q5Z.6qR9u7u/Q5Z', 'lehoang@school.edu.vn', 'NGuyễn Hoàng Minh Quân', '0912334455', 'https://ui-avatars.com/api/?name=Le+Hoang', 'STUDENT', 'ACTIVE', '3122410143', '2026-09-28 07:41:25.207629', '2026-09-28 07:41:25.207629', NULL);
INSERT INTO public.users VALUES (12, 'havi', '$2a$10$95KKwd.tNhHsGlGwhlI0c.5jOAAJ9S7hflVMOonCcU0ltnqJGVtIO', 'a@gmail.com', 'havi', '1234567894', '', 'TEACHER', 'ACTIVE', NULL, '2026-09-30 16:06:41.867765', '2026-09-30 16:06:41.867765', NULL);
INSERT INTO public.users VALUES (10, 'gb111', '$2a$10$Msd0925QlIbEacoEhIAN7uXLXSRtoFzKCkZpRT7SLL3wqiV4leuqi', 'aaa@gmail.co', 'Gia Bảo Nguyễn Hoàng', '1111111111', '', 'STUDENT', 'ACTIVE', '0', '2026-09-30 13:36:22.915197', '2026-09-30 13:36:22.915197', NULL);
INSERT INTO public.users VALUES (13, 'MaiPhuHao', '$2a$10$0NTIJUL7Qq6lH/QGxSmggOFxw52jburSXu03b.TYD0bZ3Txo9QwWe', 'moonlightmaika@gmail.com', 'Noobhao', '0363917110', '', 'STUDENT', 'ACTIVE', '1', '2026-10-01 18:08:51.689474', '2026-10-01 18:08:51.689474', NULL);
INSERT INTO public.users VALUES (14, 'giahao', '$2a$10$ssQhkRQOOuo8J3p1ut8jwOlUtcHBguFY2FdOBjuM7brLRyfpCgENa', 'giahao@gmail.com', 'Trương Gia Hào', '1234567898', '', 'STUDENT', 'ACTIVE', '2', '2026-10-02 04:41:38.097804', '2026-10-02 04:41:38.292565', NULL);
INSERT INTO public.users VALUES (16, 'tuantai', '$2a$10$jAjm3Nbbp6MTGY.zyDzVXevG7vIMhNstcZifpS8BuG56HhzBxYNAS', 'tuantai@gmail.com', 'Phạm Tuấn Tài', '1234567822', '', 'STUDENT', 'ACTIVE', '3', '2026-10-02 04:47:25.164926', '2026-10-02 04:47:25.328746', NULL);
INSERT INTO public.users VALUES (18, 'hieunguyen', '$2a$10$SC0xVKpyjo2M7yVek6alwOkYllJq3Y5QDtYfDkWn01sN222wmc/vO', 'hieunguyen@gmail.com', 'Trần Hiếu Nguyên', '1234567800', 'avatars/avatar_user_18_1791482081904.png', 'TEACHER', 'ACTIVE', NULL, '2026-10-08 17:26:32.423304', '2026-10-08 17:54:43.387299', 'TC-18');
INSERT INTO public.users VALUES (17, 'gb1111', '$2a$10$T/OQjfc23Kg3zq9fQszAHOqTOC8q9YH7uw7B2hUha/1ZRs8NwMn16', 'aaa@gmail.com', 'Nguyễn Hoàng Gia Bảo', '0811111112', 'avatars/avatar_user_17_1791290040328.jpg', 'TEACHER', 'ACTIVE', NULL, '2026-10-06 12:26:47.712094', '2026-10-06 12:34:15.801226', 'TC-17');
INSERT INTO public.users VALUES (19, 'anhhuy0', '$2a$10$/.OAINmW6j.tR.J/8eeOA.btFp0U1kVeCprGvd9OoW0H68t3.68xy', 'b@gmail.com', 'Lê Ngọc Anh Huy', '0586785211', '', 'STUDENT', 'ACTIVE', 'ST-19', '2026-10-10 05:21:54.820094', '2026-10-10 05:21:54.964252', NULL);
INSERT INTO public.users VALUES (20, 'Tuệ Minh', '$2a$10$X0DbQjHTskbgJUzFwdjMZO4ASXCCghzZ53as8WNBQaT/avLPXRxk.', 'nguyentueminh297@gmail.com', 'Nguyễn', '0779455212', NULL, 'STUDENT', 'ACTIVE', 'ST-20', '2026-10-10 13:17:54.019119', '2026-10-10 13:22:11.343137', NULL);
INSERT INTO public.users VALUES (8, 'anhhuy', '$2a$10$wiR9Quv2gvocxd.aaFcMEevgoVVLWhFE47uENCKv4VQZrMyDUO.aW', 'userc@example.co', 'Lê Ngọc Anh Huy', '0861111111', 'avatars/avatar_user_8_1791707976989.png', 'TEACHER', 'ACTIVE', NULL, '2026-09-29 01:32:01.290616', '2026-10-11 08:39:38.720599', 'TC-01');


--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 424
-- Name: answer_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.answer_options_id_seq', 419, true);


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 422
-- Name: answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.answers_id_seq', 130, true);


--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 436
-- Name: attempt_section_scores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attempt_section_scores_id_seq', 1, false);


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 406
-- Name: attendances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendances_id_seq', 7, true);


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 401
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.classes_id_seq', 17, true);


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 428
-- Name: exam_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_assignments_id_seq', 8, true);


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 434
-- Name: exam_attempt_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_attempt_events_id_seq', 1, false);


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 432
-- Name: exam_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_attempts_id_seq', 1, true);


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 418
-- Name: exam_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exam_sections_id_seq', 18, true);


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 416
-- Name: exams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exams_id_seq', 8, true);


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 408
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lessons_id_seq', 2, true);


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 404
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.materials_id_seq', 1, false);


--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 414
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 5, true);


--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 426
-- Name: question_scoring_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.question_scoring_rules_id_seq', 10, true);


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 420
-- Name: questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questions_id_seq', 116, true);


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 410
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.requests_id_seq', 3, true);


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 440
-- Name: student_answer_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_answer_values_id_seq', 1, false);


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 438
-- Name: student_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_answers_id_seq', 1, false);


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 399
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.subjects_id_seq', 3, true);


--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 397
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- TOC entry 3987 (class 2606 OID 18511)
-- Name: absence_request_details absence_request_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_request_details
    ADD CONSTRAINT absence_request_details_pkey PRIMARY KEY (request_id);


--
-- TOC entry 4016 (class 2606 OID 18751)
-- Name: answer_options answer_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answer_options
    ADD CONSTRAINT answer_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4011 (class 2606 OID 18731)
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT answers_pkey PRIMARY KEY (id);


--
-- TOC entry 4046 (class 2606 OID 18901)
-- Name: attempt_section_scores attempt_section_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt_section_scores
    ADD CONSTRAINT attempt_section_scores_pkey PRIMARY KEY (id);


--
-- TOC entry 3968 (class 2606 OID 17752)
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- TOC entry 3985 (class 2606 OID 18496)
-- Name: class_join_request_details class_join_request_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_join_request_details
    ADD CONSTRAINT class_join_request_details_pkey PRIMARY KEY (request_id);


--
-- TOC entry 3959 (class 2606 OID 17700)
-- Name: classes classes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_code_key UNIQUE (code);


--
-- TOC entry 3961 (class 2606 OID 17698)
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- TOC entry 4030 (class 2606 OID 18809)
-- Name: exam_assignment_classes exam_assignment_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignment_classes
    ADD CONSTRAINT exam_assignment_classes_pkey PRIMARY KEY (assignment_id, class_id);


--
-- TOC entry 4033 (class 2606 OID 18825)
-- Name: exam_assignment_students exam_assignment_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignment_students
    ADD CONSTRAINT exam_assignment_students_pkey PRIMARY KEY (assignment_id, student_id);


--
-- TOC entry 4025 (class 2606 OID 18796)
-- Name: exam_assignments exam_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignments
    ADD CONSTRAINT exam_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4043 (class 2606 OID 18882)
-- Name: exam_attempt_events exam_attempt_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempt_events
    ADD CONSTRAINT exam_attempt_events_pkey PRIMARY KEY (id);


--
-- TOC entry 4037 (class 2606 OID 18858)
-- Name: exam_attempts exam_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 4065 (class 2606 OID 19058)
-- Name: exam_media exam_media_object_path_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_media
    ADD CONSTRAINT exam_media_object_path_key UNIQUE (object_path);


--
-- TOC entry 4067 (class 2606 OID 19056)
-- Name: exam_media exam_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_media
    ADD CONSTRAINT exam_media_pkey PRIMARY KEY (id);


--
-- TOC entry 4001 (class 2606 OID 18685)
-- Name: exam_sections exam_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_sections
    ADD CONSTRAINT exam_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 3994 (class 2606 OID 18659)
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- TOC entry 3940 (class 2606 OID 17604)
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- TOC entry 3975 (class 2606 OID 18447)
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- TOC entry 3966 (class 2606 OID 17737)
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- TOC entry 3992 (class 2606 OID 18533)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3964 (class 2606 OID 17716)
-- Name: class_students pk_class_students; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_students
    ADD CONSTRAINT pk_class_students PRIMARY KEY (class_id, student_id);


--
-- TOC entry 4021 (class 2606 OID 18770)
-- Name: question_scoring_rules question_scoring_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_scoring_rules
    ADD CONSTRAINT question_scoring_rules_pkey PRIMARY KEY (id);


--
-- TOC entry 4007 (class 2606 OID 18708)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3983 (class 2606 OID 18477)
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4063 (class 2606 OID 18978)
-- Name: student_answer_options student_answer_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_options
    ADD CONSTRAINT student_answer_options_pkey PRIMARY KEY (answer_value_id, option_id);


--
-- TOC entry 4058 (class 2606 OID 18960)
-- Name: student_answer_values student_answer_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_values
    ADD CONSTRAINT student_answer_values_pkey PRIMARY KEY (id);


--
-- TOC entry 4053 (class 2606 OID 18929)
-- Name: student_answers student_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 3955 (class 2606 OID 17685)
-- Name: subjects subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);


--
-- TOC entry 3957 (class 2606 OID 17683)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- TOC entry 4019 (class 2606 OID 18753)
-- Name: answer_options uq_answer_options_answer_order; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answer_options
    ADD CONSTRAINT uq_answer_options_answer_order UNIQUE (answer_id, order_index);


--
-- TOC entry 4023 (class 2606 OID 19035)
-- Name: question_scoring_rules uq_answer_scoring_rules_count; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_scoring_rules
    ADD CONSTRAINT uq_answer_scoring_rules_count UNIQUE (answer_id, correct_count);


--
-- TOC entry 4014 (class 2606 OID 18733)
-- Name: answers uq_answers_question_order; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT uq_answers_question_order UNIQUE (question_id, order_index);


--
-- TOC entry 4049 (class 2606 OID 18903)
-- Name: attempt_section_scores uq_attempt_section_scores_attempt_section; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt_section_scores
    ADD CONSTRAINT uq_attempt_section_scores_attempt_section UNIQUE (attempt_id, section_id);


--
-- TOC entry 3972 (class 2606 OID 17754)
-- Name: attendances uq_attendances_class_student_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT uq_attendances_class_student_date UNIQUE (class_id, student_id, date);


--
-- TOC entry 4041 (class 2606 OID 18860)
-- Name: exam_attempts uq_exam_attempts_assignment_student; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT uq_exam_attempts_assignment_student UNIQUE (assignment_id, student_id);


--
-- TOC entry 4004 (class 2606 OID 18687)
-- Name: exam_sections uq_exam_sections_order; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_sections
    ADD CONSTRAINT uq_exam_sections_order UNIQUE (exam_id, order_index);


--
-- TOC entry 3999 (class 2606 OID 19003)
-- Name: exams uq_exams_teacher_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT uq_exams_teacher_code UNIQUE (teacher_id, code);


--
-- TOC entry 3977 (class 2606 OID 18554)
-- Name: lessons uq_lessons_class_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT uq_lessons_class_date UNIQUE (class_id, lesson_date);


--
-- TOC entry 4009 (class 2606 OID 18710)
-- Name: questions uq_questions_section_order; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT uq_questions_section_order UNIQUE (section_id, order_index);


--
-- TOC entry 4060 (class 2606 OID 18962)
-- Name: student_answer_values uq_student_answer_values_answer; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_values
    ADD CONSTRAINT uq_student_answer_values_answer UNIQUE (student_answer_id, answer_id);


--
-- TOC entry 4055 (class 2606 OID 18931)
-- Name: student_answers uq_student_answers_attempt_question; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT uq_student_answers_attempt_question UNIQUE (attempt_id, question_id);


--
-- TOC entry 3943 (class 2606 OID 17623)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3945 (class 2606 OID 17625)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3947 (class 2606 OID 17619)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3949 (class 2606 OID 17627)
-- Name: users users_student_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_student_code_key UNIQUE (student_code);


--
-- TOC entry 3951 (class 2606 OID 18391)
-- Name: users users_teacher_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_teacher_code_key UNIQUE (teacher_code);


--
-- TOC entry 3953 (class 2606 OID 17621)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 3941 (class 1259 OID 17605)
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- TOC entry 3988 (class 1259 OID 18522)
-- Name: idx_absence_request_details_lesson; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_absence_request_details_lesson ON public.absence_request_details USING btree (lesson_id);


--
-- TOC entry 4017 (class 1259 OID 18759)
-- Name: idx_answer_options_answer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_answer_options_answer_id ON public.answer_options USING btree (answer_id);


--
-- TOC entry 4012 (class 1259 OID 18739)
-- Name: idx_answers_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_answers_question_id ON public.answers USING btree (question_id);


--
-- TOC entry 4047 (class 1259 OID 18914)
-- Name: idx_attempt_section_scores_section_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempt_section_scores_section_id ON public.attempt_section_scores USING btree (section_id);


--
-- TOC entry 3969 (class 1259 OID 18552)
-- Name: idx_attendances_lesson_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendances_lesson_id ON public.attendances USING btree (lesson_id);


--
-- TOC entry 3970 (class 1259 OID 17765)
-- Name: idx_attendances_student_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendances_student_date ON public.attendances USING btree (student_id, date);


--
-- TOC entry 3962 (class 1259 OID 18638)
-- Name: idx_classes_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classes_teacher_id ON public.classes USING btree (teacher_id);


--
-- TOC entry 4031 (class 1259 OID 18820)
-- Name: idx_exam_assignment_classes_class_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_assignment_classes_class_id ON public.exam_assignment_classes USING btree (class_id);


--
-- TOC entry 4034 (class 1259 OID 19101)
-- Name: idx_exam_assignment_students_class_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_assignment_students_class_id ON public.exam_assignment_students USING btree (class_id) WHERE (class_id IS NOT NULL);


--
-- TOC entry 4035 (class 1259 OID 18836)
-- Name: idx_exam_assignment_students_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_assignment_students_student_id ON public.exam_assignment_students USING btree (student_id);


--
-- TOC entry 4026 (class 1259 OID 18802)
-- Name: idx_exam_assignments_exam_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_assignments_exam_id ON public.exam_assignments USING btree (exam_id);


--
-- TOC entry 4027 (class 1259 OID 18803)
-- Name: idx_exam_assignments_exam_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_assignments_exam_status ON public.exam_assignments USING btree (exam_id, status);


--
-- TOC entry 4028 (class 1259 OID 18804)
-- Name: idx_exam_assignments_status_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_assignments_status_time ON public.exam_assignments USING btree (status, open_time, close_time);


--
-- TOC entry 4044 (class 1259 OID 18888)
-- Name: idx_exam_attempt_events_attempt_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_attempt_events_attempt_time ON public.exam_attempt_events USING btree (attempt_id, event_time);


--
-- TOC entry 4038 (class 1259 OID 18872)
-- Name: idx_exam_attempts_assignment_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_attempts_assignment_status ON public.exam_attempts USING btree (assignment_id, status);


--
-- TOC entry 4039 (class 1259 OID 18871)
-- Name: idx_exam_attempts_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_attempts_student_id ON public.exam_attempts USING btree (student_id);


--
-- TOC entry 4068 (class 1259 OID 19069)
-- Name: idx_exam_media_cleanup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_media_cleanup ON public.exam_media USING btree (status, next_cleanup_at);


--
-- TOC entry 4069 (class 1259 OID 19070)
-- Name: idx_exam_media_draft; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_media_draft ON public.exam_media USING btree (teacher_id, draft_token);


--
-- TOC entry 4070 (class 1259 OID 19071)
-- Name: idx_exam_media_exam; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_media_exam ON public.exam_media USING btree (exam_id);


--
-- TOC entry 4002 (class 1259 OID 18693)
-- Name: idx_exam_sections_exam_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exam_sections_exam_id ON public.exam_sections USING btree (exam_id);


--
-- TOC entry 3995 (class 1259 OID 18671)
-- Name: idx_exams_subject_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exams_subject_id ON public.exams USING btree (subject_id);


--
-- TOC entry 3996 (class 1259 OID 18670)
-- Name: idx_exams_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exams_teacher_id ON public.exams USING btree (teacher_id);


--
-- TOC entry 3997 (class 1259 OID 18672)
-- Name: idx_exams_teacher_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exams_teacher_status ON public.exams USING btree (teacher_id, status);


--
-- TOC entry 3973 (class 1259 OID 18453)
-- Name: idx_lessons_class_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lessons_class_id ON public.lessons USING btree (class_id);


--
-- TOC entry 3989 (class 1259 OID 18539)
-- Name: idx_notifications_user_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_created_at ON public.notifications USING btree (user_id, created_at DESC);


--
-- TOC entry 3990 (class 1259 OID 18540)
-- Name: idx_notifications_user_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_is_read ON public.notifications USING btree (user_id, is_read);


--
-- TOC entry 4005 (class 1259 OID 18716)
-- Name: idx_questions_section_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_questions_section_id ON public.questions USING btree (section_id);


--
-- TOC entry 3978 (class 1259 OID 18489)
-- Name: idx_requests_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_receiver ON public.requests USING btree (receiver_id);


--
-- TOC entry 3979 (class 1259 OID 18491)
-- Name: idx_requests_receiver_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_receiver_status ON public.requests USING btree (receiver_id, status);


--
-- TOC entry 3980 (class 1259 OID 18488)
-- Name: idx_requests_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_sender ON public.requests USING btree (sender_id);


--
-- TOC entry 3981 (class 1259 OID 18490)
-- Name: idx_requests_sender_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_requests_sender_status ON public.requests USING btree (sender_id, status);


--
-- TOC entry 4061 (class 1259 OID 18989)
-- Name: idx_student_answer_options_option_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_answer_options_option_id ON public.student_answer_options USING btree (option_id);


--
-- TOC entry 4056 (class 1259 OID 18973)
-- Name: idx_student_answer_values_answer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_answer_values_answer_id ON public.student_answer_values USING btree (answer_id);


--
-- TOC entry 4050 (class 1259 OID 18948)
-- Name: idx_student_answers_grading_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_answers_grading_status ON public.student_answers USING btree (grading_status);


--
-- TOC entry 4051 (class 1259 OID 18947)
-- Name: idx_student_answers_question_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_answers_question_id ON public.student_answers USING btree (question_id);


--
-- TOC entry 4112 (class 2606 OID 19064)
-- Name: exam_media exam_media_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_media
    ADD CONSTRAINT exam_media_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE SET NULL;


--
-- TOC entry 4113 (class 2606 OID 19059)
-- Name: exam_media exam_media_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_media
    ADD CONSTRAINT exam_media_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(id);


--
-- TOC entry 4084 (class 2606 OID 18617)
-- Name: absence_request_details fk_absence_request_details_lesson; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_request_details
    ADD CONSTRAINT fk_absence_request_details_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- TOC entry 4085 (class 2606 OID 18512)
-- Name: absence_request_details fk_absence_request_details_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_request_details
    ADD CONSTRAINT fk_absence_request_details_request FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;


--
-- TOC entry 4092 (class 2606 OID 18754)
-- Name: answer_options fk_answer_options_answer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answer_options
    ADD CONSTRAINT fk_answer_options_answer FOREIGN KEY (answer_id) REFERENCES public.answers(id) ON DELETE CASCADE;


--
-- TOC entry 4091 (class 2606 OID 18734)
-- Name: answers fk_answers_question; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.answers
    ADD CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


--
-- TOC entry 4103 (class 2606 OID 18904)
-- Name: attempt_section_scores fk_attempt_section_scores_attempt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt_section_scores
    ADD CONSTRAINT fk_attempt_section_scores_attempt FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 4104 (class 2606 OID 18909)
-- Name: attempt_section_scores fk_attempt_section_scores_section; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attempt_section_scores
    ADD CONSTRAINT fk_attempt_section_scores_section FOREIGN KEY (section_id) REFERENCES public.exam_sections(id) ON DELETE CASCADE;


--
-- TOC entry 4076 (class 2606 OID 18602)
-- Name: attendances fk_attendances_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT fk_attendances_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 4077 (class 2606 OID 18607)
-- Name: attendances fk_attendances_lesson; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT fk_attendances_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- TOC entry 4078 (class 2606 OID 18174)
-- Name: attendances fk_attendances_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT fk_attendances_student FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4082 (class 2606 OID 18632)
-- Name: class_join_request_details fk_class_join_request_details_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_join_request_details
    ADD CONSTRAINT fk_class_join_request_details_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 4083 (class 2606 OID 18497)
-- Name: class_join_request_details fk_class_join_request_details_request; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_join_request_details
    ADD CONSTRAINT fk_class_join_request_details_request FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;


--
-- TOC entry 4073 (class 2606 OID 18597)
-- Name: class_students fk_class_students_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_students
    ADD CONSTRAINT fk_class_students_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 4074 (class 2606 OID 18164)
-- Name: class_students fk_class_students_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_students
    ADD CONSTRAINT fk_class_students_student FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4071 (class 2606 OID 18149)
-- Name: classes fk_classes_subject; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT fk_classes_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- TOC entry 4072 (class 2606 OID 18154)
-- Name: classes fk_classes_teacher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4095 (class 2606 OID 18810)
-- Name: exam_assignment_classes fk_exam_assignment_classes_assignment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignment_classes
    ADD CONSTRAINT fk_exam_assignment_classes_assignment FOREIGN KEY (assignment_id) REFERENCES public.exam_assignments(id) ON DELETE CASCADE;


--
-- TOC entry 4096 (class 2606 OID 18815)
-- Name: exam_assignment_classes fk_exam_assignment_classes_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignment_classes
    ADD CONSTRAINT fk_exam_assignment_classes_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 4097 (class 2606 OID 18826)
-- Name: exam_assignment_students fk_exam_assignment_students_assignment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignment_students
    ADD CONSTRAINT fk_exam_assignment_students_assignment FOREIGN KEY (assignment_id) REFERENCES public.exam_assignments(id) ON DELETE CASCADE;


--
-- TOC entry 4098 (class 2606 OID 19096)
-- Name: exam_assignment_students fk_exam_assignment_students_class_context; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignment_students
    ADD CONSTRAINT fk_exam_assignment_students_class_context FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- TOC entry 4099 (class 2606 OID 18831)
-- Name: exam_assignment_students fk_exam_assignment_students_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignment_students
    ADD CONSTRAINT fk_exam_assignment_students_student FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4094 (class 2606 OID 18797)
-- Name: exam_assignments fk_exam_assignments_exam; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_assignments
    ADD CONSTRAINT fk_exam_assignments_exam FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- TOC entry 4102 (class 2606 OID 18883)
-- Name: exam_attempt_events fk_exam_attempt_events_attempt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempt_events
    ADD CONSTRAINT fk_exam_attempt_events_attempt FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 4100 (class 2606 OID 18861)
-- Name: exam_attempts fk_exam_attempts_assignment; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT fk_exam_attempts_assignment FOREIGN KEY (assignment_id) REFERENCES public.exam_assignments(id) ON DELETE CASCADE;


--
-- TOC entry 4101 (class 2606 OID 18866)
-- Name: exam_attempts fk_exam_attempts_student; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT fk_exam_attempts_student FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4089 (class 2606 OID 18688)
-- Name: exam_sections fk_exam_sections_exam; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exam_sections
    ADD CONSTRAINT fk_exam_sections_exam FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- TOC entry 4087 (class 2606 OID 18665)
-- Name: exams fk_exams_subject; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT fk_exams_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- TOC entry 4088 (class 2606 OID 18660)
-- Name: exams fk_exams_teacher; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT fk_exams_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id);


--
-- TOC entry 4079 (class 2606 OID 18612)
-- Name: lessons fk_lessons_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT fk_lessons_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 4075 (class 2606 OID 18627)
-- Name: materials fk_materials_class; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT fk_materials_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- TOC entry 4086 (class 2606 OID 18534)
-- Name: notifications fk_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4090 (class 2606 OID 18711)
-- Name: questions fk_questions_section; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT fk_questions_section FOREIGN KEY (section_id) REFERENCES public.exam_sections(id) ON DELETE CASCADE;


--
-- TOC entry 4080 (class 2606 OID 18483)
-- Name: requests fk_requests_receiver; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT fk_requests_receiver FOREIGN KEY (receiver_id) REFERENCES public.users(id);


--
-- TOC entry 4081 (class 2606 OID 18478)
-- Name: requests fk_requests_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT fk_requests_sender FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- TOC entry 4093 (class 2606 OID 19036)
-- Name: question_scoring_rules fk_scoring_rules_answer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_scoring_rules
    ADD CONSTRAINT fk_scoring_rules_answer FOREIGN KEY (answer_id) REFERENCES public.answers(id) ON DELETE CASCADE;


--
-- TOC entry 4110 (class 2606 OID 18984)
-- Name: student_answer_options fk_student_answer_options_option; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_options
    ADD CONSTRAINT fk_student_answer_options_option FOREIGN KEY (option_id) REFERENCES public.answer_options(id) ON DELETE CASCADE;


--
-- TOC entry 4111 (class 2606 OID 18979)
-- Name: student_answer_options fk_student_answer_options_value; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_options
    ADD CONSTRAINT fk_student_answer_options_value FOREIGN KEY (answer_value_id) REFERENCES public.student_answer_values(id) ON DELETE CASCADE;


--
-- TOC entry 4108 (class 2606 OID 18968)
-- Name: student_answer_values fk_student_answer_values_answer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_values
    ADD CONSTRAINT fk_student_answer_values_answer FOREIGN KEY (answer_id) REFERENCES public.answers(id) ON DELETE CASCADE;


--
-- TOC entry 4109 (class 2606 OID 18963)
-- Name: student_answer_values fk_student_answer_values_student_answer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answer_values
    ADD CONSTRAINT fk_student_answer_values_student_answer FOREIGN KEY (student_answer_id) REFERENCES public.student_answers(id) ON DELETE CASCADE;


--
-- TOC entry 4105 (class 2606 OID 18932)
-- Name: student_answers fk_student_answers_attempt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT fk_student_answers_attempt FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON DELETE CASCADE;


--
-- TOC entry 4106 (class 2606 OID 18942)
-- Name: student_answers fk_student_answers_graded_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT fk_student_answers_graded_by FOREIGN KEY (graded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4107 (class 2606 OID 18937)
-- Name: student_answers fk_student_answers_question; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT fk_student_answers_question FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE;


-- Completed on 2026-10-11 18:48:53

--
-- PostgreSQL database dump complete
--

