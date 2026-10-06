package com.classmanagement.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;



@Configuration
public class WebConfig implements WebMvcConfigurer {

        @Value("${app.storage.local-dir}")
        private String localDir;

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