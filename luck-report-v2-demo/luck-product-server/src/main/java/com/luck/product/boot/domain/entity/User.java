package com.luck.product.boot.domain.entity;

import lombok.Data;

import java.util.List;

/**
 * 用户实体
 * @author luck
 * @date 2025/03/31
 */
@Data
public class User {

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码
     */
    private String password;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 状态：0-禁用，1-启用
     */
    private Integer status;

    /**
     * 用户角色
     */
    private List<String> roles;
}
