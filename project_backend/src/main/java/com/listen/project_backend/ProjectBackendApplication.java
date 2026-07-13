package com.listen.project_backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.listen.project_backend.mapper")
@EnableScheduling
public class ProjectBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProjectBackendApplication.class, args);
    }
}







