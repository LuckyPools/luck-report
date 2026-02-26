package com.luck.report.font.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * UReport字体配置根类
 * 导入所有字体相关配置
 */
@Configuration
@Import({ChineseFontConfig.class, EnglishFontConfig.class})
public class UreportFontConfig {
}
