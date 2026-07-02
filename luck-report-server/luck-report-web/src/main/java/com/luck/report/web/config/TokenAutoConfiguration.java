package com.luck.report.web.config;

import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.service.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * 报表 Token 自动装配入口。
 * <p>负责：
 * <ul>
 *   <li>注册 {@link TokenProperties} 为 Spring Bean（{@code bean.tokenProperties}）</li>
 *   <li>启动时打印当前模式（PROD / DISABLED），方便审计与 CI 拦截</li>
 * </ul>
 * <p><b>注意：secret、ttl-seconds、clock-skew-seconds 已移除，由第三方 TokenService 实现自行管理。</b>
 *
 * @author luck-report
 * @since 1.0.0
 */
@Configuration
@EnableConfigurationProperties(TokenProperties.class)
public class TokenAutoConfiguration {

    private static final Logger log = LoggerFactory.getLogger(TokenAutoConfiguration.class);

    /**
     * 把默认配置类注册的 {@code TokenProperties} 也用 {@code bean.tokenProperties} 暴露，
     * 方便业务方按 Bean 名注入（与"所有 bean 统一 bean.* 前缀"约定一致）。
     */
    @Bean(name = "bean.tokenProperties")
    @Primary
    public TokenProperties tokenPropertiesBean(TokenProperties props) {
        return props;
    }

    /**
     * 启动时打印模式日志。{@code mode=DISABLED} 在生产环境同步打 ERROR，
     * CI 流水线可 grep 拦截。
     */
    public void logStartup(TokenProperties props) {
        String mode = props.isEnabled() ? "PROD (强制校验，未带 token 一律 401)" : "DISABLED (拦截器已停用，所有接口匿名访问，仅限本地调试)";
        StringBuilder sb = new StringBuilder();
        sb.append("\n========== LuckReport Token ==========\n");
        sb.append("enabled       : ").append(props.isEnabled()).append('\n');
        sb.append("mode          : ").append(mode).append('\n');
        sb.append("header-name   : ").append(props.getHeaderName()).append('\n');
        sb.append("allow-query   : ").append(props.isAllowQueryToken()).append('\n');
        sb.append("admin-roles   : ").append(props.getAdminRoles()).append('\n');
        sb.append("======================================\n");
        sb.append("注: secret/ttl/clock-skew 已移除，由第三方 TokenService 实现\n");
        if (props.isEnabled()) {
            log.info(sb.toString());
        } else {
            log.error(sb.toString());
        }
    }

    /**
     * 启动时回调：把日志逻辑挂到 ApplicationStartedEvent 上。
     * <p>直接用 {@code @PostConstruct} 也行，但事件方式不依赖装配顺序。
     */
    @org.springframework.context.event.EventListener(
            org.springframework.boot.context.event.ApplicationStartedEvent.class)
    public void onApplicationStarted(org.springframework.boot.context.event.ApplicationStartedEvent event) {
        TokenProperties props = event.getApplicationContext()
                .getBean("bean.tokenProperties", TokenProperties.class);
        logStartup(props);
    }
}
