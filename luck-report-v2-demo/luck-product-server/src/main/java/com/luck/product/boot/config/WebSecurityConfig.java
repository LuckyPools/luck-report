package com.luck.product.boot.config;

import cn.hutool.core.util.ArrayUtil;
import com.luck.product.boot.handler.*;
import com.luck.product.boot.properties.SecurityIgnoreProperties;
import com.luck.product.boot.security.SecurityAuthorizationManager;
import com.luck.product.boot.security.password.PasswordAuthenticationFilter;
import com.luck.product.boot.security.password.PasswordAuthenticationProvider;
import com.luck.product.boot.security.token.TokenAuthenticationFilter;
import com.luck.product.boot.security.token.TokenAuthenticationProvider;
import com.luck.product.boot.service.ILoginUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * <p>
 * Security配置类
 * </p>
 *
 * @author qy
 * @since 2019-11-18
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    private DefaultLogoutHandler defaultLogoutHandler;

    @Autowired
    private DefaultLogoutSuccessHandler defaultLogoutSuccessHandler;

    @Autowired
    private AuthenticationSuccessHandler authenticationSuccessHandler;

    @Autowired
    private AuthenticationFailureHandler authenticationFailureHandler;

    @Autowired
    private ILoginUserService loginUserService;

    @Autowired
    private SecurityIgnoreProperties securityIgnoreProperties;

    @Autowired
    private AuthenticationEntryPointImpl authenticationEntryPoint;

    @Autowired
    private AccessDeniedHandlerImpl accessDeniedHandler;

    @Autowired
    private SecurityAuthorizationManager securityAuthorizationManager;

    /**
     * 配置具体的权限规则
     * @param httpSecurity
     * @throws Exception
     */
    @Override
    protected void configure(HttpSecurity httpSecurity) throws Exception {
        httpSecurity.authorizeRequests()
                // 允许匿名登录的请求
                .antMatchers(ArrayUtil.toArray(securityIgnoreProperties.getAuthUrls(),String.class)).anonymous()
                .anyRequest().authenticated()
                .and()
                // 异常处理
                .exceptionHandling()
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
                .and()
                .csrf().disable()
                // 允许 iframe 嵌入（报表 iframe 嵌入需要）
                .headers()
                .frameOptions().disable()
                .and()
                // 统一登出配置
                .logout()
                .logoutUrl("/auth/logout")
                .addLogoutHandler(defaultLogoutHandler)
                .logoutSuccessHandler(defaultLogoutSuccessHandler)
                .permitAll();
        // 添加过滤器
        httpSecurity
                // filter 调用 authenticate 方法时，会传递指定类型的 token
                // provider 调用 support 方法比对 token 类型，类型相同才处理
                .authenticationProvider(passwordAuthenticationProvider())
                .addFilterBefore(passwordAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .authenticationProvider(tokenAuthenticationProvider())
                .addFilterAfter(securityAuthorizationManager, TokenAuthenticationFilter.class);
    }

    /**
     * 配置全局的认证相关的信息，如用户查询服务
     * @param auth
     */
    @Override
    public void configure(AuthenticationManagerBuilder auth) {
        // 密码处理
        auth.authenticationProvider(passwordAuthenticationProvider());
        // Token认证
        auth.authenticationProvider(tokenAuthenticationProvider());
    }

    /**
     * 全局请求忽略规则配置（比如说静态文件，比如说注册页面）
     * @param web
     */
    @Override
    public void configure(WebSecurity web) {
        web.ignoring().antMatchers("/openAi/**");
    }

    @Bean
    @Override
    protected AuthenticationManager authenticationManager() throws Exception {
        return super.authenticationManager();
    }

    /**
     * 密码登录配置
     * @return
     */
    @Bean
    public PasswordAuthenticationProvider passwordAuthenticationProvider() {
        return new PasswordAuthenticationProvider(loginUserService);
    }

    @Bean
    public PasswordAuthenticationFilter passwordAuthenticationFilter() {
        PasswordAuthenticationFilter authenticationFilter = new PasswordAuthenticationFilter();
        authenticationFilter.setAuthenticationSuccessHandler(authenticationSuccessHandler);
        authenticationFilter.setAuthenticationFailureHandler(authenticationFailureHandler);
        return authenticationFilter;
    }


    @Bean
    public TokenAuthenticationProvider tokenAuthenticationProvider() {
        return new TokenAuthenticationProvider();
    }

    @Bean
    public TokenAuthenticationFilter tokenAuthenticationFilter() {
        return new TokenAuthenticationFilter(securityIgnoreProperties);
    }

}

