package com.luck.product.boot.security.password;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 *
 * 密码验证过滤器
 * @Author: crush
 * @Date: 2021-09-08 21:13
 * version 1.0
 */
public class PasswordAuthenticationFilter extends UsernamePasswordAuthenticationFilter {

    /**
     * 前端传来的 参数名 - 用于request.getParameter 获取
     */
    private final String USERNAME_PARAMETER = "username";

    /**
     * 前端传来的 参数名 - 用于request.getParameter 获取
     */
    private final String PASSWORD_PARAMETER = "password";

    @Autowired
    @Override
    public void setAuthenticationManager(AuthenticationManager authenticationManager) {
        super.setAuthenticationManager(authenticationManager);
    }

    /**
     * 通过 传入的 参数 创建 匹配器
     * 即 Filter过滤的 url
     */
    public PasswordAuthenticationFilter() {
        // 默认使用 login 作为过滤地址
        super();
        this.setRequiresAuthenticationRequestMatcher(new AntPathRequestMatcher("/auth/login","POST"));
    }

    /**
     * 给权限
     * filter 获得 用户名（邮箱） 和 密码（验证码） 装配到 token 上 ，
     * 然后把token 交给 provider 进行授权
     * @throws AuthenticationException
     */
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        String username = request.getParameter(USERNAME_PARAMETER);
        String password = request.getParameter(PASSWORD_PARAMETER);
        // 封装 token
        PasswordAuthenticationToken authenticationToken = new PasswordAuthenticationToken(username, password, "");
        // 交给 AuthenticationManager 进行认证
        return this.getAuthenticationManager().authenticate(authenticationToken);
    }

}
