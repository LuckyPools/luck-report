package com.luck.agent.controller;

import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 聊天控制器
 * 提供与大模型的流式对话接口
 *
 * @author luck
 */
@RestController
@RequestMapping("/chat")
public class ChatController {

    private static final String API_KEY = "sk-391c6103719e4169933ebcd160280b12";
    private static final String BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    private static final String MODEL_NAME = "qwen3.6-plus";

    private final StreamingChatModel streamingChatModel;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    /**
     * 初始化聊天助手
     * 构建基于阿里百炼大模型的流式对话服务
     */
    public ChatController() {
        this.streamingChatModel = OpenAiStreamingChatModel.builder()
                .apiKey(API_KEY)
                .baseUrl(BASE_URL)
                .modelName(MODEL_NAME)
                .build();
    }

    /**
     * 流式对话接口
     *
     * @param message 用户输入的消息
     * @return SSE事件流，包含大模型的流式响应
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestParam String message) {
        SseEmitter emitter = new SseEmitter(60000L);

        executorService.submit(() -> {
            try {
                streamingChatModel.chat(message, new StreamingChatResponseHandler() {
                    @Override
                    public void onPartialResponse(String partialResponse) {
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("message")
                                    .data(partialResponse));
                        } catch (Exception e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onCompleteResponse(ChatResponse completeResponse) {
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("done")
                                    .data("[DONE]"));
                            emitter.complete();
                        } catch (Exception e) {
                            emitter.completeWithError(e);
                        }
                    }

                    @Override
                    public void onError(Throwable error) {
                        try {
                            emitter.send(SseEmitter.event()
                                    .name("error")
                                    .data(error.getMessage()));
                            emitter.completeWithError(error);
                        } catch (Exception e) {
                            emitter.completeWithError(e);
                        }
                    }
                });
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        emitter.onCompletion(() -> {});
        emitter.onTimeout(() -> emitter.complete());

        return emitter;
    }
}
