package com.classmanagement.backend.service.impl;

import com.classmanagement.backend.service.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.net.http.HttpClient;
import java.time.Duration;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "supabase")
public class SupabaseStorageService implements StorageService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String secretKey;
    private final String bucket;

    public SupabaseStorageService(
            @Value("${app.storage.supabase.url}") String supabaseUrl,

            @Value("${app.storage.supabase.secret-key}") String secretKey,

            @Value("${app.storage.supabase.bucket}") String bucket) {
        this.supabaseUrl = removeTrailingSlash(supabaseUrl);
        this.secretKey = secretKey;
        this.bucket = bucket;

        var requestFactory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(20));
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    // =====================================================
    // UPLOAD
    // =====================================================

    @Override
    public String upload(
            String folder,
            String fileName,
            MultipartFile file) {

        String objectPath = buildObjectPath(
                folder,
                fileName);

        String url = supabaseUrl
                + "/storage/v1/object/"
                + encode(bucket)
                + "/"
                + encodePath(objectPath);

        try {
            restClient.post()
                    .uri(url)
                    .header(
                            "Authorization",
                            "Bearer " + secretKey)
                    .header(
                            "apikey",
                            secretKey)
                    .contentType(resolveContentType(file))
                    .body(file.getBytes())
                    .retrieve()
                    .toBodilessEntity();

            return objectPath;

        } catch (IOException e) {

            throw new IllegalStateException(
                    "Không thể đọc file để tải lên");

        } catch (Exception e) {

            throw new IllegalStateException(
                    "Không thể tải file lên Supabase Storage");
        }
    }

    // =====================================================
    // DELETE
    // =====================================================

    @Override
    public void delete(String objectPath) {

        if (objectPath == null || objectPath.isBlank()) {
            return;
        }

        String url = supabaseUrl
                + "/storage/v1/object/"
                + encode(bucket)
                + "/"
                + encodePath(objectPath);

        try {
            restClient.delete()
                    .uri(url)
                    .header(
                            "Authorization",
                            "Bearer " + secretKey)
                    .header(
                            "apikey",
                            secretKey)
                    .retrieve()
                    .toBodilessEntity();

        } catch (HttpClientErrorException.NotFound e) {
            // Retry-safe: an already deleted object is a successful cleanup.
        } catch (Exception e) {
            throw new IllegalStateException("Không thể xóa file khỏi Supabase Storage");
        }
    }

    @Override
    public String getUrl(String objectPath) {

        if (objectPath == null || objectPath.isBlank()) {
            return null;
        }

        return supabaseUrl
                + "/storage/v1/object/public/"
                + encode(bucket)
                + "/"
                + encodePath(objectPath);
    }

    // =====================================================
    // HELPERS
    // =====================================================

    private String buildObjectPath(
            String folder,
            String fileName) {

        if (folder == null || folder.isBlank()) {
            return fileName;
        }

        return folder.replaceAll("^/+|/+$", "")
                + "/"
                + fileName;
    }

    private MediaType resolveContentType(
            MultipartFile file) {

        String contentType = file.getContentType();

        if (contentType == null
                || contentType.isBlank()) {

            return MediaType.APPLICATION_OCTET_STREAM;
        }

        try {
            return MediaType.parseMediaType(contentType);

        } catch (Exception e) {

            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private String encode(String value) {

        return UriUtils.encodePathSegment(
                value,
                StandardCharsets.UTF_8);
    }

    private String encodePath(String path) {

        return UriUtils.encodePath(
                path,
                StandardCharsets.UTF_8);
    }

    private String removeTrailingSlash(String value) {

        if (value == null) {
            return "";
        }

        return value.replaceAll("/+$", "");
    }


}
