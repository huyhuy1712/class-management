package com.classmanagement.backend.config;

import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.avatar.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry) {

        String uploadPath = Path.of(uploadDir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        registry.addResourceHandler(
                "/uploads/avatars/**").addResourceLocations(uploadPath);
    }
}