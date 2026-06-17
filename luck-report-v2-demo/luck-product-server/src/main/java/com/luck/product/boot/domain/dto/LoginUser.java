package com.luck.product.boot.domain.dto;

import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * 登录用户信息
 * @author luck
 * @date 2025/03/31
 */
@Data
public class LoginUser implements UserDetails {
    
    private Long userId;
    private String username;
    private String password;
    private String token;
    private List<String> permissions;
    private List<String> roles;
    
    /**
     * 账户是否未过期
     */
    private boolean accountNonExpired = true;
    
    /**
     * 账户是否未锁定
     */
    private boolean accountNonLocked = true;
    
    /**
     * 凭证是否未过期
     */
    private boolean credentialsNonExpired = true;
    
    /**
     * 账户是否启用
     */
    private boolean enabled = true;
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }
    
    @Override
    public String getPassword() {
        return this.password;
    }
    
    @Override
    public String getUsername() {
        return this.username;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return credentialsNonExpired;
    }
    
    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
