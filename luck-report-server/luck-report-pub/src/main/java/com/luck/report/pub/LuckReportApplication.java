package com.luck.report.pub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * @author luck
 */
@SpringBootApplication
public class LuckReportApplication {

    public static void main(String[] args) {
        SpringApplication.run(LuckReportApplication.class, args);
        System.out.println("Luck-Report 后台启动成功！");
    }

}
