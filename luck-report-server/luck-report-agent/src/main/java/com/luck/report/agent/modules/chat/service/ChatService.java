package com.luck.report.agent.modules.chat.service;

import com.luck.report.agent.modules.chat.domain.vo.ChatRequest;
import com.luck.report.agent.modules.chat.domain.vo.CompactRequest;
import com.luck.report.agent.modules.chat.domain.vo.CompactResult;
import com.luck.report.agent.domain.vo.ResultVO;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 聊天对话服务接口
 * 处理流式对话转发和对话压缩等核心业务逻辑
 *
 * @author luck
 */
public interface ChatService {

    /**
     * 流式对话
     * 通过 ChatUtils 构建流式请求，以 SSE 方式推送响应
     * 支持 Function Calling：当请求携带 tools 参数时，将工具定义传给大模型，
     * 大模型可通过 tool_calls 返回工具调用指令，后端解析后以 tool_use 事件推送
     *
     * @param request 聊天请求 DTO，包含消息内容、历史上下文、附件、工具定义、模型ID等
     * @return SSE事件流，包含 message / tool_use / done / error 事件
     */
    SseEmitter chatStream(ChatRequest request);

    /**
     * 对话压缩
     * 接收早期对话消息，通过 ChatUtils.askModel() 调用 LLM 生成结构化摘要，
     * 替代原始消息以减少上下文 token 消耗
     *
     * @param request 压缩请求，包含 messages、existingSummary、reportSnapshot、compactPrompt、modelId 等
     * @return ResultVO<CompactResult> 压缩结果，包含 summary 和 keyOperations
     */
    ResultVO<CompactResult> compact(CompactRequest request);
}
