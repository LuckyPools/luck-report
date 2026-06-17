package com.luck.product.boot.utils;

import com.luck.product.boot.domain.dto.LoginUser;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 用户工具类
 * @author luck
 * @date 2025/03/31
 */
public class UserUtils {

    /**
     * 获取当前登录用户
     * @return 登录用户
     */
    public static LoginUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof LoginUser) {
            return (LoginUser) authentication.getPrincipal();
        }
        return null;
    }

    /**
     * 获取当前用户ID
     * @return 用户ID
     */
    public static Long getCurrentUserId() {
        LoginUser loginUser = getCurrentUser();
        if (loginUser != null) {
            return loginUser.getUserId();
        }
        return null;
    }

    /**
     * 获取当前用户名
     * @return 用户名
     */
    public static String getCurrentUsername() {
        LoginUser loginUser = getCurrentUser();
        if (loginUser != null) {
            return loginUser.getUsername();
        }
        return null;
    }

    /**
     * 根据token获取用户（从SecurityContext中）
     * @param token token
     * @return 登录用户
     */
    public static LoginUser getUserByToken(String token) {
        // 这里简化实现，实际应该从缓存或数据库中根据token获取用户
        // 由于token验证已经在JwtUtils中完成，这里直接返回当前用户
        String username = JwtUtils.getUsernameFromToken(token);
        if (StringUtils.isEmpty(username)) {
            return null;
        }
        LoginUser loginUser = new LoginUser();
        loginUser.setUsername(username);
        return loginUser;
    }
}
