package com.luck.product.boot.domain.enums;

/**
 * 认证状态码枚举
 * @author luck
 * @date 2025/03/31
 */
public enum AuthCodeEnum {
    
    /**
     * 账号不存在
     */
    ACCOUNT_NOT_EXIST(1001, "账号不存在"),
    
    /**
     * 登录密码错误
     */
    LOGIN_PASSWORD_ERROR(1002, "用户名或密码错误"),
    
    /**
     * 账号已过期
     */
    ACCOUNT_EXPIRED(1003, "账号已过期"),
    
    /**
     * 账号已被锁定
     */
    ACCOUNT_LOCKED(1004, "账号已被锁定"),
    
    /**
     * 用户凭证已失效
     */
    ACCOUNT_CREDENTIAL_EXPIRED(1005, "用户凭证已失效"),
    
    /**
     * 账号已被禁用
     */
    ACCOUNT_DISABLE(1006, "账号已被禁用"),
    
    /**
     * 验证码错误
     */
    VERIFY_CODE_ERROR(1007, "验证码错误"),
    
    /**
     * 权限不足
     */
    PERMISSION_DENIED(1008, "权限不足"),
    
    /**
     * 未授权
     */
    USER_UNAUTHORIZED(1009, "未授权"),
    
    /**
     * 未知错误
     */
    UNKNOWN_ERROR(9999, "未知错误");
    
    private final int code;
    private final String message;
    
    AuthCodeEnum(int code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public int getCode() {
        return code;
    }
    
    public String getMessage() {
        return message;
    }
}
