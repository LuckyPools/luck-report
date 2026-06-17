package com.luck.product.boot.security;

import com.alibaba.fastjson.JSON;
import com.luck.product.boot.domain.enums.AuthCodeEnum;
import com.luck.product.boot.utils.CacheUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.SecurityConfig;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.FilterInvocation;
import org.springframework.security.web.access.intercept.FilterInvocationSecurityMetadataSource;
import org.springframework.security.web.access.intercept.FilterSecurityInterceptor;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.CollectionUtils;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 安全授权管理器
 * 替代webflux中的AuthorizationManager
 * 实现基于URL的权限控制
 * @author luck
 */
@Component
public class SecurityAuthorizationManager extends FilterSecurityInterceptor {

    private final AntPathMatcher antPathMatcher = new AntPathMatcher();

    /**
     * 动态权限数据源，用于获取拦截资源的权限配置
     */
    @Component
    public class DynamicSecurityMetadataSource implements FilterInvocationSecurityMetadataSource {

        @Override
        public Collection<ConfigAttribute> getAttributes(Object object) throws IllegalArgumentException {
            // 获取当前请求路径
            String requestUrl = ((FilterInvocation) object).getRequestUrl();

            // 获取访问资源所需的角色
            List<String> authorizedRoles = getAuthorizedRoles(requestUrl);

            // 没有配置权限规则表示无需授权，直接放行
            if (CollectionUtils.isEmpty(authorizedRoles)) {
                return null;
            }

            // 将角色转换为ConfigAttribute
            return SecurityConfig.createList(authorizedRoles.toArray(new String[0]));
        }

        /**
         * 获取指定URL需要的角色
         */
        private List<String> getAuthorizedRoles(String requestUrl) {
            List<String> authorizedRoles = new ArrayList<>();

            // 从内存缓存获取URL角色映射关系
            Map<Object, Object> urlRoleMap = CacheUtils.get("roleMap");
            if (urlRoleMap != null) {
                for (Map.Entry<Object, Object> entry : urlRoleMap.entrySet()) {
                    String permissionUrl = (String) entry.getKey();
                    List<String> roles = JSON.parseArray((String) entry.getValue(), String.class);
                    if (antPathMatcher.match(permissionUrl, requestUrl)) {
                        authorizedRoles.addAll(roles);
                    }
                }
            }

            return authorizedRoles;
        }

        @Override
        public Collection<ConfigAttribute> getAllConfigAttributes() {
            return null;
        }

        @Override
        public boolean supports(Class<?> clazz) {
            return FilterInvocation.class.isAssignableFrom(clazz);
        }
    }

    /**
     * 动态权限决策管理器，用于判断用户是否有访问权限
     */
    @Component
    public class DynamicAccessDecisionManager implements org.springframework.security.access.AccessDecisionManager {

        @Override
        public void decide(Authentication authentication, Object object, Collection<ConfigAttribute> configAttributes) throws AccessDeniedException, InsufficientAuthenticationException {
            // 未设置权限配置，直接放行
            if (CollectionUtils.isEmpty(configAttributes)) {
                return;
            }

            // 获取用户权限
            Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
            Set<String> userRoles = authorities.stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toSet());

            // 检查用户是否具有所需权限
            boolean hasRequiredRole = configAttributes.stream()
                    .map(ConfigAttribute::getAttribute)
                    .anyMatch(userRoles::contains);

            if (!hasRequiredRole) {
                throw new AccessDeniedException(AuthCodeEnum.PERMISSION_DENIED.getMessage());
            }
        }

        @Override
        public boolean supports(ConfigAttribute attribute) {
            return true;
        }

        @Override
        public boolean supports(Class<?> clazz) {
            return FilterInvocation.class.isAssignableFrom(clazz);
        }
    }

    /**
     * 初始化配置
     */
    @PostConstruct
    public void init() {
        // 设置安全元数据资源
        super.setSecurityMetadataSource(new DynamicSecurityMetadataSource());
        // 设置访问决策管理器
        super.setAccessDecisionManager(new DynamicAccessDecisionManager());
        // 设置是否发布事件
        super.setPublishAuthorizationSuccess(true);
    }

    @Override
    public Class<?> getSecureObjectClass() {
        return FilterInvocation.class;
    }

    @Override
    public void invoke(FilterInvocation filterInvocation) throws java.io.IOException, javax.servlet.ServletException {
        super.invoke(filterInvocation);
    }
}
