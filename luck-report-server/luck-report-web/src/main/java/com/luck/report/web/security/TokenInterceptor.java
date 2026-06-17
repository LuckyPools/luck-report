package com.luck.report.web.security;

import com.luck.report.web.security.token.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Map;

/**
 * 报表访问 Token 拦截器。
 * <p>Bean 名：{@code bean.tokenInterceptor}。
 * <p>注册位置：{@code WebConfig.addInterceptors}，
 * 覆盖 {@code /<prefix>/manage/**} / {@code api/**} / {@code chart/**} / {@code designer/**} 等所有
 * 业务路径，**排除** {@code /<prefix>/auth/**}（由第三方业务系统登录过滤器管）。
 *
 * <p>校验流程（按顺序）：
 * <ol>
 *   <li>标了 {@link NoToken} 注解 → 直接放行</li>
 *   <li>OPTIONS 预检（CORS）→ 放行</li>
 *   <li>{@code enabled=false} → 直接放行（本地 ui3 调试）</li>
 *   <li>解析 token（query 优先 + header 兜底）</li>
 *   <li>{@code verifyToken} 验签 + 黑名单 → claims 为 null 直接 401</li>
 *   <li>scope 校验（{@link RequireScope} 注解 + HandlerMethod）</li>
 *   <li>写入 {@link TokenContext}</li>
 * </ol>
 *
 * @author luck-report
 * @since 1.0.0
 */
@Component("bean.tokenInterceptor")
public class TokenInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TokenInterceptor.class);

    private final TokenService tokenService;
    private final TokenProperties props;

    public TokenInterceptor(TokenService tokenService, TokenProperties props) {
        this.tokenService = tokenService;
        this.props = props;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) throws Exception {
        // 0. 注解豁免：@NoToken 直接放行
        if (isAnnotatedNoToken(handler)) {
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

        // 3. 解析 token
        String token = tokenService.resolveToken(req, props);
        Map<String, Object> claims = (token == null) ? null : tokenService.verifyToken(token);

        if (claims == null) {
            writeUnauthorized(resp, "token 无效或已过期");
            return false;
        }

        // 4. scope 校验：HandlerMethod 上的 @RequireScope 注解
        if (handler instanceof HandlerMethod) {
            HandlerMethod hm = (HandlerMethod) handler;
            RequireScope rs = hm.getMethodAnnotation(RequireScope.class);
            if (rs == null) {
                rs = hm.getBeanType().getAnnotation(RequireScope.class);
            }
            if (rs != null) {
                String required = rs.value();
                String actual = claims.get("scope") == null ? "" : String.valueOf(claims.get("scope"));
                // designer 隐含拥有 preview 权限
                if (!required.equals(actual) && !"designer".equals(actual)) {
                    writeUnauthorized(resp, "token 权限不足：非 " + required + " scope");
                    return false;
                }
            }
        }

        // 5. 写入请求上下文
        TokenContext.set(claims);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse resp,
                                Object handler, Exception ex) {
        TokenContext.clear();
    }

    private boolean isAnnotatedNoToken(Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return false;
        }
        HandlerMethod hm = (HandlerMethod) handler;
        if (hm.getMethodAnnotation(NoToken.class) != null) {
            return true;
        }
        return hm.getBeanType().getAnnotation(NoToken.class) != null;
    }

    private void writeUnauthorized(HttpServletResponse resp, String message) throws IOException {
        resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter writer = resp.getWriter();
        writer.write("{\"code\":401,\"msg\":\"" + escape(message) + "\"}");
        writer.flush();
    }

    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
