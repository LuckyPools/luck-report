package com.luck.report.web.interceptor;

import com.luck.report.web.exception.AuthException;
import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.service.TokenService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 管理端/设计器权限拦截器。
 * <p>拦截管理端和设计器相关请求，校验用户是否为报表管理员。
 * <p>校验逻辑：用户角色必须在 {@code adminRoles} 配置中。
 * <p>URL pattern：{@code /manage/**}, {@code /designer/**}, {@code /api/**}, {@code /importexcel/**}。
 * <p>order=2（在 TokenInterceptor 之后），确保 token 已校验、用户角色已就绪。
 * <p>权限拒绝时抛出 {@link AuthException}，由 {@code ReportExceptionHandler} 统一处理。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Slf4j
public class ManageInterceptor implements HandlerInterceptor {

    private final TokenService tokenService;
    private final TokenProperties tokenProperties;

    public ManageInterceptor(TokenService tokenService, TokenProperties tokenProperties) {
        this.tokenService = tokenService;
        this.tokenProperties = tokenProperties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        // 1. 总开关关闭时跳过
        if (tokenProperties == null || !tokenProperties.isEnabled()) {
            return true;
        }

        // 2. 获取用户角色
        List<String> userRoles = tokenService.getCurrentUserRoles(request);
        List<String> adminRoles = tokenProperties.getAdminRoles();

        // 3. 校验是否为管理员
        boolean isAdmin = userRoles != null && adminRoles != null && !adminRoles.isEmpty()
                && userRoles.stream().anyMatch(adminRoles::contains);

        if (!isAdmin) {
            log.warn("管理端权限拒绝: userRoles={}, adminRoles={}, uri={}",
                    userRoles, adminRoles, request.getRequestURI());
            throw new AuthException("非报表管理员，禁止访问设计器/管理端");
        }

        return true;
    }
}
