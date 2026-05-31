package com.luck.agent.vo;

import lombok.Data;

import java.util.List;

/**
 * 上下文消息
 * 用于构建多轮对话历史，扩展支持 tool_result 角色和 assistant 的 tool_calls
 *
 * @author luck
 */
@Data
public class ContextMessage {

    /** 消息角色：user / assistant / system / tool_result */
    private String role;

    /** 消息内容 */
    private String content;

    /** 关联的工具调用ID（仅 tool_result 角色需要） */
    private String toolCallId;

    /** 关联的工具名称（仅 tool_result 角色需要） */
    private String toolName;

    /**
     * assistant 消息携带的工具调用列表
     * OpenAI Function Calling 协议要求：当 assistant 调用了工具，
     * 回传消息历史时必须包含完整的 tool_calls 信息
     */
    private List<ToolCallMessage> toolCalls;
}
