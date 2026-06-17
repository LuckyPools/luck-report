package com.luck.product.boot.security.token;

import com.luck.product.boot.domain.enums.AuthCodeEnum;
import com.luck.product.boot.utils.JwtUtils;
import com.luck.product.boot.domain.dto.LoginUser;
import com.luck.product.boot.utils.UserUtils;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * Token认证提供者
 * 替代webflux中的TokenAuthenticationManager
 * @author luck
 */
public class TokenAuthenticationProvider implements AuthenticationProvider {

    /**
     * 校验令牌、校验成功返回用户权限等信息
     * @param authentication 认证对象
     * @return 认证后的对象
     * @throws AuthenticationException 认证异常
     */
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        String token = authentication.getPrincipal().toString();
        Boolean isExpired = JwtUtils.isTokenExpired(token);
        if(isExpired) {
            throw new BadCredentialsException(AuthCodeEnum.ACCOUNT_CREDENTIAL_EXPIRED.getMessage());
        }
        
        LoginUser loginUser = UserUtils.getUserByToken(token);
        if (loginUser == null) {
            throw new BadCredentialsException(AuthCodeEnum.USER_UNAUTHORIZED.getMessage());
        }
        
        Collection<? extends GrantedAuthority> roles = loginUser.getAuthorities();
        // principal主体 credentials凭证 authorities权限
        return new UsernamePasswordAuthenticationToken(
                loginUser,
                null,
                roles
        );
    }

    /**
     * 判断当前认证提供者是否支持指定的认证对象类型
     * 只支持纯粹的 UsernamePasswordAuthenticationToken，不支持其子类（如 PasswordAuthenticationToken）
     * @param authentication 认证对象类型
     * @return 是否支持
     */
    @Override
    public boolean supports(Class<?> authentication) {
        return UsernamePasswordAuthenticationToken.class.equals(authentication);
    }

}
