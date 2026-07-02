package com.luck.report.web.interceptor;

import com.luck.report.web.annotation.Anonymous;
import com.luck.report.web.exception.TokenException;
import com.luck.report.web.modules.report.constant.ReportUrls;
import com.luck.report.web.modules.role.mapper.ReportRoleMapper;
import com.luck.report.web.security.AnonymousRole;
import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.service.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 报表访问 Token 拦截器。
 * <p>注册位置：{@code WebConfig.addInterceptors}，
 * 覆盖 {@code /<prefix>/manage/**} / {@code api/**} / {@code chart/**} / {@code designer/**} 等所有
 * 业务路径，**排除** {@code /<prefix>/auth/**}（由第三方业务系统登录过滤器管）。
 *
 * <p>校验流程（按顺序）：
 * <ol>
 *   <li>标了 {@link Anonymous} 注解 → 直接放行</li>
 *   <li>OPTIONS 预检（CORS）→ 放行</li>
 *   <li>{@code enabled=false} → 直接放行（本地 ui3 调试）</li>
 *   <li>预览路径 + 报表绑定了 ANONYMOUS 角色 → 直接放行（匿名预览）</li>
 *   <li>解析 token（query 优先 + header 兜底）</li>
 *   <li>{@code verifyToken} 校验 → 失败抛出 {@link TokenException}</li>
 * </ol>
 *
 * <p>权限校验由 {@link ManageInterceptor} 和 {@link PreviewInterceptor} 处理，
 * 本拦截器只负责 token 有效性。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class TokenInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TokenInterceptor.class);

    private final TokenService tokenService;
    private final TokenProperties props;
    private final ReportRoleMapper roleMapper;

    public TokenInterceptor(TokenService tokenService, TokenProperties props, ReportRoleMapper roleMapper) {
        this.tokenService = tokenService;
        this.props = props;
        this.roleMapper = roleMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) throws Exception {
        // 0. 注解豁免：@Anonymous 直接放行
        if (isAnnotatedAnonymous(handler)) {
            return true;
        }
        // 1. OPTIONS 预检直接放行（CORS）
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            return true;
        }

        // 2. 总开关：关闭则直接放行（本地 ui3 调试走这里）
        if (!props.isEnabled()) {
            log.debug("[Token] enabled=false, skip verify, requestUri={}", req.getRequestURI());
            return true;
        }

        // 3. 预览路径下检查报表是否绑定了 ANONYMOUS 角色（允许无 token 访问）
        if (ReportUrls.isPreviewPath(req.getRequestURI()) && checkAndMarkAnonymousReport(req)) {
            log.debug("[Token] 匿名报表放行: uri={}", req.getRequestURI());
            return true;
        }

        // 4. 解析 token（从 header 或 query 参数）
        String token = resolveToken(req);
        if (token == null || token.isEmpty()) {
            throw new TokenException("缺少 token");
        }

        // 5. 校验 token
        if (!tokenService.verifyToken(token)) {
            throw new TokenException("token 无效或已过期");
        }

        // token 校验完成，权限校验由 ManageInterceptor/PreviewInterceptor 处理
        return true;
    }

    /**
     * 检查当前请求的报表是否绑定了 ANONYMOUS 角色，并将结果写入 request attribute 供下游拦截器复用。
     */
    private boolean checkAndMarkAnonymousReport(HttpServletRequest req) {
        String filePath = getFilePath(req);
        if (filePath == null || filePath.isEmpty()) {
            req.setAttribute(ReportUrls.ATTR_ANONYMOUS_REPORT, Boolean.FALSE);
            return false;
        }
        List<String> boundRoles = roleMapper.selectRoleCodesByFilePath(filePath);
        boolean isAnonymous = boundRoles != null && boundRoles.contains(AnonymousRole.CODE);
        req.setAttribute(ReportUrls.ATTR_ANONYMOUS_REPORT, isAnonymous);
        return isAnonymous;
    }

    /**
     * 从请求中提取 filePath 参数（支持 query、form、multipart）。
     */
    private String getFilePath(HttpServletRequest request) {
        String filePath = request.getParameter("filePath");
        return filePath;
    }

    private boolean isAnnotatedAnonymous(Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return false;
        }
        HandlerMethod hm = (HandlerMethod) handler;
        if (hm.getMethodAnnotation(Anonymous.class) != null) {
            return true;
        }
        return hm.getBeanType().getAnnotation(Anonymous.class) != null;
    }

    private String resolveToken(HttpServletRequest request) {
        // 1. query 参数（仅在 allowQueryToken=true 时）
        if (props.isAllowQueryToken()) {
            String t = request.getParameter("token");
            if (t == null || t.isEmpty()) {
                t = request.getParameter(props.getHeaderName());
            }
            if (t != null && !t.isEmpty()) {
                return t;
            }
        }
        // 2. header
        String header = props.getHeaderName();
        String t = request.getHeader(header);
        return (t == null || t.isEmpty()) ? null : t;
    }
}
