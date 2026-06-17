package com.luck.product.boot.domain.enums;

/**
 * HTTP状态码枚举
 * @author luck
 * @date 2025/03/31
 */
public enum HttpCodeEnum {
    
    /**
     * 成功
     */
    SUCCESS(200, "成功"),
    
    /**
     * 成功（OK别名）
     */
    OK(200, "成功"),
    
    /**
     * 失败
     */
    ERROR(500, "失败"),
    
    /**
     * 未知错误
     */
    UN_KNOW_ERROR(500, "未知错误"),
    
    /**
     * 未授权
     */
    UNAUTHORIZED(401, "未授权"),
    
    /**
     * 禁止访问
     */
    FORBIDDEN(403, "禁止访问"),
    
    /**
     * 未找到
     */
    NOT_FOUND(404, "未找到");
    
    private final int code;
    private final String message;
    
    HttpCodeEnum(int code, String message) {
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
