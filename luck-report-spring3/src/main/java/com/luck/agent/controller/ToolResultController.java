package com.luck.agent.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.agent.service.ChatSessionManager;
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
 * 工具结果控制器
 * 接收前端工具执行结果，通知等待的线程
 *
 * @author luck
 */
@Slf4j
@RestController
@RequestMapping("/chat")
public class ToolResultController {

    private final ChatSessionManager sessionManager;
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 构造函数
     *
     * @param sessionManager 会话管理服务
     */
    public ToolResultController(ChatSessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    /**
     * 接收工具执行结果
     * 前端执行工具后，将结果发送到此接口
     * 后端通知等待的线程，让工具继续执行
     *
     * @param request 工具执行结果请求
     * @return SSE事件流，确认结果已接收
     */
    @PostMapping(value = "/tool-result", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter receiveToolResult(@RequestBody ToolResultRequest request) {
        SseEmitter emitter = new SseEmitter(30000L);

        executorService.submit(() -> {
            try {
                log.info("收到工具执行结果: callId={}, toolName={}, result={}",
                        request.getCallId(), request.getToolName(), request.getResult());

                String resultJson = objectMapper.writeValueAsString(request.getResult());
                sessionManager.setToolResult(request.getCallId(), resultJson);

                emitter.send(SseEmitter.event()
                        .name("message")
                        .data("工具结果已接收"));
                emitter.send(SseEmitter.event()
                        .name("done")
                        .data("[DONE]"));
                emitter.complete();
            } catch (Exception e) {
                log.error("处理工具结果失败", e);
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

        emitter.onCompletion(() -> {});
        emitter.onTimeout(() -> emitter.complete());

        return emitter;
    }
}
