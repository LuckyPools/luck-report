package com.luck.report.agent.modules.businessKnowledgeConfig.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * API响应封装类
 * 用于统一封装Controller的返回结果
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    /** 响应消息 */
    private String message;

    /** 响应数据 */
    private T data;

    /** 是否成功 */
    private boolean success;

    /**
     * 成功响应
     *
     * @param message 响应消息
     * @param data 响应数据
     * @return API响应
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(message, data, true);
    }

    /**
     * 成功响应（无数据）
     *
     * @param message 响应消息
     * @return API响应
     */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(message, null, true);
    }

    /**
     * 失败响应
     *
     * @param message 响应消息
     * @return API响应
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(message, null, false);
    }
}
