package com.luck.agent.modules.chat.domain.vo;

/**
 * 大模型调用响应结果
 * 封装非流式调用的响应数据，供调用方直接使用
 *
 * 调用者：ChatCompactController.compact() → ChatUtils.askModel()
 *
 * @author luck
 */
public class AskModelResponse {
    /** HTTP 状态码 */
    private final int statusCode;
    /** 响应体内容 */
    private final String body;
    /** 是否成功 */
    private final boolean success;

    /**
     * 构造函数
     *
     * @param statusCode HTTP 状态码，类型：int
     * @param body 响应体内容，类型：String
     * @param success 是否成功，类型：boolean
     */
    public AskModelResponse(int statusCode, String body, boolean success) {
        this.statusCode = statusCode;
        this.body = body;
        this.success = success;
    }

    /**
     * 获取 HTTP 状态码
     *
     * @return HTTP 状态码，类型：int
     */
    public int getStatusCode() { return statusCode; }

    /**
     * 获取响应体内容
     *
     * @return 响应体内容，类型：String
     */
    public String getBody() { return body; }

    /**
     * 是否成功
     *
     * @return 是否成功，类型：boolean
     */
    public boolean isSuccess() { return success; }
}
