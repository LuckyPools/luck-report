package com.luck.report.pub;

import com.luck.report.web.config.LuckReportMainConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Import;

/**
 * @author luck
 */
@SpringBootApplication(scanBasePackages = {"com.luck.report"})
@Import(LuckReportMainConfig.class)
public class LuckReportApplication {

    public static void main(String[] args) {
        SpringApplication.run(LuckReportApplication.class, args);
        System.out.println("Luck-Report 后台启动成功！");
    }

}
