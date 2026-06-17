package com.luck.product.boot.service;

import com.luck.product.boot.domain.dto.LoginUser;
import com.luck.product.boot.domain.entity.User;

/**
 * 远程用户服务接口
 * @author luck
 * @date 2025/03/31
 */
public interface RemoteUserService {
    
    /**
     * 退出登录
     */
    void logout();
    
    /**
     * 根据用户名获取用户
     * @param username 用户名
     * @return 用户信息
     */
    User getUserByUsername(String username);
    
    /**
     * 创建token
     * @param loginUser 登录用户
     * @return token
     */
    String createToken(LoginUser loginUser);
}
