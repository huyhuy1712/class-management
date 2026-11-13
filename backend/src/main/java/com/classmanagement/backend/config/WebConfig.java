package com.classmanagement.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.RequiredArgsConstructor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;



@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

        private final TeacherActivityInterceptor teacherActivityInterceptor;

        @Value("${app.storage.local-dir}")
        private String localDir;

        @Override
        public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(teacherActivityInterceptor);
        }

        @Override
        public void addResourceHandlers(
                        ResourceHandlerRegistry registry) {

                String location = Paths.get(localDir)
                                .toAbsolutePath()
                                .normalize()
                                .toUri()
                                .toString();

                registry.addResourceHandler("/uploads/**")
                                .addResourceLocations(location)
                                .setCachePeriod(2592000)
                                .setUseLastModified(true);
        }
}