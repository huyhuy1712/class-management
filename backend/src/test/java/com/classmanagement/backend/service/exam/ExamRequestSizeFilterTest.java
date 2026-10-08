package com.classmanagement.backend.service.exam;

import com.classmanagement.backend.security.ExamRequestSizeFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import static org.junit.jupiter.api.Assertions.*;

class ExamRequestSizeFilterTest {
    @Test void rejectsAdvertisedOversizedPayload() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/exams");
        request.setContent(new byte[11]);
        var response = new MockHttpServletResponse();
        new ExamRequestSizeFilter(10).doFilter(request, response,
                (req, res) -> fail("Oversized payload must not reach controller"));
        assertEquals(413, response.getStatus());
    }

    @Test void boundsPayloadWithoutContentLength() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/exams") {
            public long getContentLengthLong() { return -1; }
        };
        request.setContent(new byte[11]);
        var response = new MockHttpServletResponse();
        new ExamRequestSizeFilter(10).doFilter(request, response, (req, res) -> req.getInputStream().readAllBytes());
        assertEquals(413, response.getStatus());
    }

    @Test void acceptsPayloadAtLimit() throws Exception {
        var request = new MockHttpServletRequest("POST", "/api/exams");
        request.setContent(new byte[10]);
        var response = new MockHttpServletResponse();
        new ExamRequestSizeFilter(10).doFilter(request, response,
                (req, res) -> assertEquals(10, req.getInputStream().readAllBytes().length));
        assertEquals(200, response.getStatus());
    }
}
