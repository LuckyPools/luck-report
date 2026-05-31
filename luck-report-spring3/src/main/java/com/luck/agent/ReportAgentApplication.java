package com.luck.agent;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot应用启动类
 *
 * @author luck
 */
@SpringBootApplication
@MapperScan("com.luck.agent.mapper")
public class ReportAgentApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReportAgentApplication.class, args);
    }
}
