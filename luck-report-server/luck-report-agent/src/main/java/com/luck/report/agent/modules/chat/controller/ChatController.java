package com.luck.report.agent.modules.chat.controller;

import com.luck.report.agent.modules.chat.domain.vo.ChatRequest;
import com.luck.report.agent.modules.chat.service.ChatService;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 聊天控制器
 * 通过 ChatService 调用阿里百炼 OpenAI 兼容 API，实现流式对话转发
 * 支持 Function Calling：将前端传入的 tools 定义转发给大模型，
 * 解析大模型返回的 tool_calls 并通过 SSE tool_use 事件推送给前端，
 * 前端执行工具后将 tool_result 回传，实现 Agentic Loop
 *
 * @author luck
 */
@RestController
@RequestMapping("${luck-report.servletPrefix:}/chat")
@AllArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * 流式对话接口（POST）
     * 委托 ChatService 处理流式对话逻辑
     *
     * @param request 聊天请求 DTO，包含消息内容、历史上下文、附件、工具定义、模型ID等
     * @return SSE事件流，包含 message / tool_use / done / error 事件
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody ChatRequest request) {
        return chatService.chatStream(request);
    }
}
