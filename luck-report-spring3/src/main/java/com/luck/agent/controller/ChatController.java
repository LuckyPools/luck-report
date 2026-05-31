package com.luck.agent.controller;

import com.luck.agent.service.ChatSessionManager;
import com.luck.agent.service.ReportAssistant;
import dev.langchain4j.service.TokenStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 聊天控制器
 * 提供与大模型的流式对话接口
 * 支持多轮对话上下文、工具调用等功能
 *
 * @author luck
 */
@Slf4j
@RestController
@RequestMapping("/chat")
public class ChatController {

    private final ChatSessionManager sessionManager;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    /**
     * 构造函数
     *
     * @param sessionManager 会话管理服务
     */
    public ChatController(ChatSessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * 流式对话接口（POST）
     * 接收 JSON 请求体，支持历史上下文消息和工具调用
     * 首次调用会创建新会话，后续调用需携带 sessionId 以保持上下文
     *
     * @param request 聊天请求 DTO，包含消息内容、会话ID等
     * @return SSE事件流，包含大模型的流式响应、工具调用信息和会话ID
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody ChatRequest request) {
        SseEmitter emitter = new SseEmitter(120000L);

        executorService.submit(() -> {
            try {
                String sessionId = request.getSessionId();
                if (sessionId == null || !sessionManager.hasSession(sessionId)) {
                    sessionId = sessionManager.createSession();
                    log.info("创建新会话: {}", sessionId);
                }

                final String finalSessionId = sessionId;
                emitter.send(SseEmitter.event()
                        .name("session")
                        .data(finalSessionId));

                sessionManager.registerEmitter(finalSessionId, emitter);

                ReportAssistant assistant = sessionManager.getAssistant(finalSessionId);
                TokenStream tokenStream = assistant.analyzeAndGenerateReport(request.getMessage());

                tokenStream
                        .onPartialResponse(token -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("message")
                                        .data(token));
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            }
                        })
                        .onCompleteResponse(response -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("done")
                                        .data("[DONE]"));
                                emitter.complete();
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            } finally {
                                sessionManager.unregisterEmitter(finalSessionId);
                            }
                        })
                        .onError(error -> {
                            try {
                                emitter.send(SseEmitter.event()
                                        .name("error")
                                        .data("出错了: " + error.getMessage()));
                                emitter.completeWithError(error);
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            } finally {
                                sessionManager.unregisterEmitter(finalSessionId);
                            }
                        })
                        .start();
            } catch (Exception e) {
                log.error("处理聊天请求失败", e);
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("处理失败: " + e.getMessage()));
                    emitter.complete();
                } catch (Exception ex) {
                    emitter.completeWithError(ex);
                }
            }
        });

        emitter.onTimeout(() -> {
            emitter.complete();
        });

        return emitter;
    }
}
