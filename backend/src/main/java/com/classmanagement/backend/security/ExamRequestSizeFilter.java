package com.classmanagement.backend.security;

import com.classmanagement.backend.exception.ExamPayloadTooLargeException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.*;
import java.nio.charset.StandardCharsets;

@Component
public class ExamRequestSizeFilter extends OncePerRequestFilter {
    private final long maxBytes;

    public ExamRequestSizeFilter(@Value("${app.exam.max-request-bytes:2097152}") long maxBytes) {
        if (maxBytes <= 0) throw new IllegalArgumentException("Giới hạn request đề thi phải lớn hơn 0");
        this.maxBytes = maxBytes;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getMethod().equals("POST")
                || !request.getRequestURI().equals(request.getContextPath() + "/api/exams");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (request.getContentLengthLong() > maxBytes) {
            reject(response);
            return;
        }
        var source = request.getInputStream();
        var bounded = new ServletInputStream() {
            private long count;
            public boolean isFinished() { return source.isFinished(); }
            public boolean isReady() { return source.isReady(); }
            public void setReadListener(ReadListener listener) { source.setReadListener(listener); }
            public int read() throws IOException {
                int value = source.read();
                if (value != -1) add(1);
                return value;
            }
            public int read(byte[] bytes, int offset, int length) throws IOException {
                int read = source.read(bytes, offset, (int) Math.min(length, maxBytes - count + 1));
                if (read > 0) add(read);
                return read;
            }
            private void add(int size) {
                count += size;
                if (count > maxBytes) throw new ExamPayloadTooLargeException();
            }
        };
        var wrapped = new HttpServletRequestWrapper(request) {
            public ServletInputStream getInputStream() { return bounded; }
            public BufferedReader getReader() {
                return new BufferedReader(new InputStreamReader(bounded, StandardCharsets.UTF_8));
            }
        };
        try {
            chain.doFilter(wrapped, response);
        } catch (ExamPayloadTooLargeException ex) {
            if (response.isCommitted()) throw ex;
            reject(response);
        }
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(413);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":413,\"message\":\"Request đề thi vượt quá dung lượng cho phép\"}");
    }
}
