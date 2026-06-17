package com.luck.product.boot.security.token;

import com.luck.product.boot.properties.SecurityIgnoreProperties;
import com.luck.product.boot.domain.enums.AuthCodeEnum;
import com.luck.product.boot.utils.JwtUtils;
import com.luck.product.boot.domain.dto.LoginUser;
import com.luck.product.boot.utils.UserUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * Token 认证过滤器
 * 替代 webflux 中的 TokenSecurityContextRepository
 * @author luck
 */
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final SecurityIgnoreProperties securityIgnoreProperties;
    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    public TokenAuthenticationFilter(SecurityIgnoreProperties securityIgnoreProperties) {
        this.securityIgnoreProperties = securityIgnoreProperties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String requestUri = request.getRequestURI();

        // 检查是否在白名单中
        if (isWhiteList(requestUri)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = JwtUtils.getToken(request);
        if (StringUtils.isEmpty(token)) {
            throw new InsufficientAuthenticationException(AuthCodeEnum.USER_UNAUTHORIZED.getMessage());
        }

        try {
            // 验证 token 并获取用户信息
            LoginUser loginUser = UserUtils.getUserByToken(token);
            if (loginUser != null) {
                // 构建认证对象
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        loginUser, null, loginUser.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                // 设置上下文
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                // token 无效，清空上下文并抛异常
                SecurityContextHolder.clearContext();
                throw new InsufficientAuthenticationException(AuthCodeEnum.USER_UNAUTHORIZED.getMessage());
            }
        } catch (InsufficientAuthenticationException e) {
            // 认证失败，直接抛出
            throw e;
        } catch (Exception e) {
            // 其他异常，清空上下文并抛出
            SecurityContextHolder.clearContext();
            throw new InsufficientAuthenticationException(AuthCodeEnum.USER_UNAUTHORIZED.getMessage());
        }

        // 继续过滤器链
        filterChain.doFilter(request, response);
    }

    /**
     * 判断请求是否在白名单中
     * @param requestUri 请求路径
     * @return 是否在白名单中
     */
    private boolean isWhiteList(String requestUri) {
        List<String> authUrls = securityIgnoreProperties.getAuthUrls();
        if (authUrls == null || authUrls.isEmpty()) {
            return false;
        }

        return authUrls.stream()
                .anyMatch(pattern -> antPathMatcher.match(pattern, requestUri));
    }
}
