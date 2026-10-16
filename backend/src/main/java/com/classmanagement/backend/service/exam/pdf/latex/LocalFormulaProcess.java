package com.classmanagement.backend.service.exam.pdf.latex;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** One bounded local batch process, without a shell or an HTTP endpoint. */
final class LocalFormulaProcess {
    private static final int MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
    private static final JsonMapper JSON = new JsonMapper();

    static final class Failure extends RuntimeException {
        private final String code;

        Failure(String code) {
            super(code);
            this.code = code;
        }

        String code() {
            return code;
        }
    }

    JsonNode run(List<String> command, Object request, Duration timeout, Path directory) {
        Process process;
        try {
            var builder = new ProcessBuilder(command);
            builder.directory(directory.toFile());
            builder.redirectError(ProcessBuilder.Redirect.DISCARD);
            builder.environment().put("HF_HUB_OFFLINE", "1");
            builder.environment().put("TRANSFORMERS_OFFLINE", "1");
            builder.environment().put("HF_HUB_DISABLE_TELEMETRY", "1");
            process = builder.start();
        } catch (IOException e) {
            throw new Failure("LOCAL_FORMULA_PROCESS_UNAVAILABLE");
        }

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var output = executor.submit(() -> {
                try (var input = process.getInputStream()) {
                    byte[] bytes = input.readNBytes(MAX_OUTPUT_BYTES + 1);
                    if (bytes.length > MAX_OUTPUT_BYTES) {
                        process.destroyForcibly();
                        throw new Failure("LOCAL_FORMULA_OUTPUT_LIMIT");
                    }
                    return new String(bytes, StandardCharsets.UTF_8);
                }
            });
            var input = executor.submit(() -> {
                try (var stream = process.getOutputStream()) {
                    stream.write(JSON.writeValueAsBytes(request));
                }
                return null;
            });

            try {
                if (!process.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS)) {
                    throw new Failure("LOCAL_FORMULA_TIMEOUT");
                }
                if (process.exitValue() != 0) {
                    throw new Failure("LOCAL_FORMULA_WORKER_FAILED");
                }
                input.get(2, TimeUnit.SECONDS);
                return JSON.readTree(output.get(2, TimeUnit.SECONDS));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new Failure("LOCAL_FORMULA_INTERRUPTED");
            } catch (Failure e) {
                throw e;
            } catch (Exception e) {
                throw new Failure("LOCAL_FORMULA_INVALID_RESPONSE");
            } finally {
                process.descendants().forEach(ProcessHandle::destroyForcibly);
                process.destroyForcibly();
                try {
                    process.waitFor(2, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                try {
                    process.getInputStream().close();
                    process.getOutputStream().close();
                } catch (IOException ignored) {
                    // Closing both pipes releases readers/writers before the executor is closed.
                }
            }
        }
    }
}
