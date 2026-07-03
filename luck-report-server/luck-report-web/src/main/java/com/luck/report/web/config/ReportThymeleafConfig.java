package com.luck.report.web.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring5.SpringTemplateEngine;
import org.thymeleaf.spring5.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

/**
 * LuckReport 独立的 Thymeleaf 模板引擎配置。
 * <p>
 * 不使用 spring-boot-starter-thymeleaf 的自动配置，而是手动创建独立的模板引擎，
 * 确保第三方项目引入本模块时无需额外配置，且不会与第三方项目自身的模板引擎冲突。
 * <p>
 * 隔离机制：
 * <ul>
 *   <li>Bean 使用明确命名 {@code luckReportTemplateEngine}，不会覆盖默认的 {@code templateEngine}</li>
 *   <li>不注册 {@code ThymeleafViewResolver}，不走 Spring MVC 视图解析流程</li>
 *   <li>ViewController 使用手动渲染 {@code templateEngine.process()}，完全绕过视图解析</li>
 * </ul>
 *
 * @author luck-report
 * @since 1.0.0
 */
@Configuration
public class ReportThymeleafConfig {

    /**
     * 是否开启模板缓存，生产环境建议开启。
     */
    @Value("${luck-report.template.cache:false}")
    private boolean templateCache;

    /**
     * 创建 LuckReport 专用的模板解析器。
     * <p>
     * 模板路径：{@code classpath:/html/}
     *
     * @return 模板解析器
     */
    @Bean(name = "bean.luckReportTemplateResolver")
    public SpringResourceTemplateResolver luckReportTemplateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setPrefix("classpath:/html/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(templateCache);
        // 设置较高顺序，确保不影响其他模板解析器
        resolver.setOrder(100);
        // 强制使用此解析器，不回退到默认解析器
        resolver.setCheckExistence(true);
        return resolver;
    }

    /**
     * 创建 LuckReport 专用的模板引擎。
     * <p>
     * 使用明确命名，避免与第三方项目的模板引擎冲突。
     *
     * @return 模板引擎
     */
    @Bean(name = "bean.luckReportTemplateEngine")
    public SpringTemplateEngine luckReportTemplateEngine() {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(luckReportTemplateResolver());
        engine.setEnableSpringELCompiler(true);
        return engine;
    }
}
