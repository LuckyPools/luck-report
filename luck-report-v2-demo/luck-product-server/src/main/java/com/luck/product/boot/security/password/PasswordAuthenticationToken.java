package com.luck.product.boot.security.password;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

/**
 * 身份令牌
 * @Author: crush
 * @Date: 2021-09-08 21:13
 * version 1.0
 */
public class PasswordAuthenticationToken extends UsernamePasswordAuthenticationToken {

    /**
     * 冗余信息
     * @param principal
     */
    private Object info;

    /**
     * @param principal 用户名
     * @param credentials 密码
     * @param info 冗余信息
     */
    public PasswordAuthenticationToken(Object principal, Object credentials, String info) {
        super(principal, credentials);
        this.info = info;
    }

    public PasswordAuthenticationToken(Object principal, Object credentials, Collection<? extends GrantedAuthority> authorities) {
        super(principal,credentials,authorities);
    }


    public Object getInfo() {
        return info;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        if (isAuthenticated) {
            throw new IllegalArgumentException("Cannot set this token to trusted - use constructor which takes a GrantedAuthority list instead");
        } else {
            super.setAuthenticated(false);
        }
    }

}
