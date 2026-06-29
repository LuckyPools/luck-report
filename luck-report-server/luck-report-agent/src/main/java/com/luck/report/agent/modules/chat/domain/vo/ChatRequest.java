package com.luck.report.agent.modules.chat.domain.vo;

import lombok.Data;

import java.util.List;
import java.util.Map;

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
     * 每个工具包含 name、description、inputSchema（前端字段，对应 OpenAI 的 parameters）
     * 可选包含 outputSchema，描述工具返回结构供 LLM 理解
     */
    private List<ToolDefinition> tools;

    /**
     * 工具调用策略（Agent Function Calling）
     * 控制大模型如何选择工具调用，格式遵循 OpenAI tool_choice 参数：
     * - "auto"：模型自行决定是否调用工具
     * - "none"：禁止调用工具
     * - {"type": "function", "function": {"name": "xxx"}}：强制调用指定工具
     * 不传时由后端根据 tools 是否为空自动决定
     */
    private Object toolChoice;

    /**
     * 是否启用深度思考
     * 启用后，大模型会先生成推理过程（reasoning_content），再生成最终回复
     * 部分模型（如 Qwen）需要通过 extra_params 配置
     */
    private Boolean deepThink = false;
}
