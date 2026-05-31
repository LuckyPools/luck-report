package com.luck.agent.controller;

import lombok.Data;

/**
 * 工具执行结果请求 DTO
 * 前端执行工具后，将结果通过此对象发送回后端
 *
 * @author luck
 */
@Data
public class ToolResultRequest {

    /**
     * 会话ID
     * 用于关联对应的 AI 对话上下文
     */
    private String sessionId;

    /**
     * 工具调用ID
     * 与之前发送的 tool_call 事件中的 callId 对应
     */
    private String callId;

    /**
     * 工具名称
     * 如 readCell、setCell 等
     */
    private String toolName;

    /**
     * 工具执行结果
     * 前端执行工具后返回的数据
     */
    private Object result;

    /**
     * 是否执行成功
     */
    private Boolean success;

    /**
     * 错误信息
     * 执行失败时的错误描述
     */
    private String error;
}
