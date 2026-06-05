package com.luck.report.agent.modules.chat.domain.vo;

import lombok.Data;

import java.util.List;

/**
 * 聊天请求 DTO
 * 接收前端 POST JSON 请求体，包含消息内容、历史上下文、附件、工具定义等
 * 扩展支持 OpenAI Function Calling 所需的 tools 参数和 tool_result 消息角色
 *
 * @author luck
 */
@Data
public class ChatRequest {

    /**
     * 会话ID
     * 用于关联多轮对话，首次请求不传，后续请求需携带
     */
    private String sessionId;

    /**
     * 大模型配置ID
     * 用于指定使用哪个大模型进行对话
     * 如果不传，则使用默认激活的第一个对话模型
     */
    private Integer modelId;

    /**
     * 用户输入的消息内容
     */
    private String message;

    /**
     * 是否启用联网搜索
     */
    private Boolean searchEnabled = false;

    /**
     * 历史消息上下文列表
     * 前端根据 historyType/historyCount 过滤后传入
     * 支持 user / assistant / system / tool_result 角色
     */
    private List<ContextMessage> contextMessages;

    /**
     * 图片附件列表
     */
    private List<AttachmentPayload> attachments;

    /**
     * 工具定义列表（Agent Function Calling）
     * 供大模型识别可调用的工具，格式遵循 OpenAI Function Calling 协议
     * 每个工具包含 name、description、inputSchema
     */
    private List<ToolDefinition> tools;
}
