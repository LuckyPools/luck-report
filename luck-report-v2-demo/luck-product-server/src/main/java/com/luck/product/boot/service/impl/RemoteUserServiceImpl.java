package com.luck.product.boot.service.impl;

import com.luck.product.boot.domain.dto.LoginUser;
import com.luck.product.boot.domain.entity.User;
import com.luck.product.boot.service.RemoteUserService;
import com.luck.product.boot.utils.JwtUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 远程用户服务实现
 * @author luck
 * @date 2025/03/31
 */
@Slf4j
@Service
public class RemoteUserServiceImpl implements RemoteUserService {

    // 模拟用户数据，实际应该从数据库获取
    private static final Map<String, User> USER_MAP = new HashMap<>();

    static {
        // 添加一个默认用户用于测试
        User admin = new User();
        admin.setUserId(1L);
        // 账号名：admin
        admin.setUsername("admin");
        // 密码：1
        admin.setPassword("ddf55f1bf1e2edf05232e268211f9bcd");
        admin.setNickname("管理员");
        admin.setEmail("admin@example.com");
        admin.setPhone("13800138000");
        admin.setStatus(1);
        // 填充角色
        List<String> roles = new ArrayList<>();
        roles.add("admin");
        admin.setRoles(roles);

        USER_MAP.put("admin", admin);
    }

    @Override
    public void logout() {
        // 本地实现，可以记录日志或执行其他清理操作
        log.info("用户退出登录");
    }

    @Override
    public User getUserByUsername(String username) {
        return USER_MAP.get(username);
    }

    @Override
    public String createToken(LoginUser loginUser) {
        // 使用JwtUtils生成token
        return JwtUtils.generateToken(loginUser.getUsername());
    }
}
