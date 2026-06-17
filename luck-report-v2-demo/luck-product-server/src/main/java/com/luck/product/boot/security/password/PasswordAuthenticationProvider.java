package com.luck.product.boot.security.password;

import com.luck.product.boot.service.ILoginUserService;
import com.luck.product.boot.utils.PasswordUtils;
import com.luck.product.boot.utils.ServletUtils;
import com.luck.product.boot.domain.dto.LoginUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeanUtils;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import javax.servlet.http.HttpServletRequest;


/**
 * 密码验证过滤器
 * @Author: crush
 * @Date: 2021-09-08 21:14
 * version 1.0
 */
public class PasswordAuthenticationProvider implements AuthenticationProvider {

    private static final Logger log = LoggerFactory.getLogger(PasswordAuthenticationProvider.class);

    private ILoginUserService loginUserService;

    public PasswordAuthenticationProvider(ILoginUserService loginUserService) {
        this.loginUserService = loginUserService;
    }

    /**
     * 认证
     * @param authentication
     * @return
     * @throws AuthenticationException
     */
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        if (!supports(authentication.getClass())) {
            return null;
        }
        PasswordAuthenticationToken token = (PasswordAuthenticationToken) authentication;
        HttpServletRequest request = ServletUtils.getRequest();
        UserDetails dbUser = loginUserService.loadUserByUsername((String) token.getPrincipal());
        if (dbUser == null) {
            throw new InternalAuthenticationServiceException("无法获取用户信息");
        }
        // 验证密码
        if(!PasswordUtils.validatePassword(token.getCredentials().toString(),dbUser.getPassword())){
            // 密码错误，增加失败次数并抛出异常
            throw new BadCredentialsException("账号或密码错误");
        }
        LoginUser loginUser = new LoginUser();
        BeanUtils.copyProperties(dbUser,loginUser);
        PasswordAuthenticationToken result = new PasswordAuthenticationToken(loginUser,null, loginUser.getAuthorities());
        result.setDetails(token.getDetails());
        return result;
    }


    @Override
    public boolean supports(Class<?> aClass) {
        return PasswordAuthenticationToken.class.isAssignableFrom(aClass);
    }

    /**
     * 密码为1时的加密测试
     * @param args
     */
    public static void main(String[] args) {
        System.out.println(new BCryptPasswordEncoder().encode("1"));
    }
}
