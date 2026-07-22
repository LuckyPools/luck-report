package com.luck.report.web.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author jack
 * @version 1.0
 * @description: 报表配置类
 * @date 2026-04-30 14:50
 */
@Data
@ConfigurationProperties(prefix = "luck-report")
public class LuckReportProperties {
    /**
     * 报表文件存储位置
     */
    private String fileStoreDir;

    /**
     * 图片存储位置
     */
    private String imgStoreDir;

    /**
     * 是否禁用文件存储
     */
    private Boolean disableFileProvider = false;

    /**
     * Servlet 前缀
     */
    private String servletPrefix;

    /**
     * 是否开启调试模式
     */
    private Boolean debug = false;

}
