package com.classmanagement.backend.service.exam.pdf.latex;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class LocalFormulaProcessTest {
    public static class Worker {
        public static void main(String[] args) throws Exception {
            System.in.readAllBytes();
            if (args[0].equals("wait")) {
                Thread.sleep(30_000);
            } else if (args[0].equals("invalid")) {
                System.out.print("not json");
            } else {
                System.out.print("{\"status\":\"ok\"}");
            }
        }
    }

    private List<String> command(String mode) {
        var executable = System.getProperty("os.name").startsWith("Windows") ? "java.exe" : "java";
        return List.of(Path.of(System.getProperty("java.home"), "bin", executable).toString(),
                "-cp", System.getProperty("java.class.path"), Worker.class.getName(), mode);
    }

    @Test
    void runsOneBatchWithoutShellAndReadsBoundedJson() {
        var response = new LocalFormulaProcess().run(command("ok"), Map.of("batch", 1),
                Duration.ofSeconds(10), Path.of(".").toAbsolutePath());
        assertEquals("ok", response.get("status").asString());
    }

    @Test
    void killsTimedOutWorkerAndDoesNotWaitForItsFullSleep() {
        var failure = assertTimeoutPreemptively(Duration.ofSeconds(5), () ->
                assertThrows(LocalFormulaProcess.Failure.class, () ->
                        new LocalFormulaProcess().run(command("wait"), Map.of(),
                                Duration.ofMillis(200), Path.of(".").toAbsolutePath())));
        assertEquals("LOCAL_FORMULA_TIMEOUT", failure.code());
    }

    @Test
    void rejectsInvalidProtocolAndUnavailableExecutable() {
        assertThrows(LocalFormulaProcess.Failure.class, () ->
                new LocalFormulaProcess().run(command("invalid"), Map.of(),
                        Duration.ofSeconds(10), Path.of(".").toAbsolutePath()));
        var failure = assertThrows(LocalFormulaProcess.Failure.class, () ->
                new LocalFormulaProcess().run(List.of("missing-formula-executable-948572"),
                        Map.of(), Duration.ofSeconds(1), Path.of(".").toAbsolutePath()));
        assertEquals("LOCAL_FORMULA_PROCESS_UNAVAILABLE", failure.code());
    }
}
