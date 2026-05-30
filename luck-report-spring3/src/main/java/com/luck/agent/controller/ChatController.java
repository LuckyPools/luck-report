package com.luck.agent.controller;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 聊天控制器
 * 提供与大模型的流式对话接口
 * 支持多轮对话上下文、图片附件、联网搜索等参数
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
     * 流式对话接口（POST）
     * 接收 JSON 请求体，支持历史上下文消息
     * 前端统一使用 POST 请求，将 message、contextMessages、attachments 等参数放入请求体
     *
     * @param request 聊天请求 DTO，包含消息内容、历史上下文、附件等
     * @return SSE事件流，包含大模型的流式响应
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody ChatRequest request) {
        SseEmitter emitter = new SseEmitter(60000L);

        executorService.submit(() -> {
            try {
                // 构建包含历史上下文的消息列表
                List<ChatMessage> messages = buildMessages(request);

                streamingChatModel.chat(messages, new StreamingChatResponseHandler() {
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

    /**
     * 根据请求参数构建 LangChain4j 消息列表
     * 将前端传入的 contextMessages 转换为 LangChain4j 的 ChatMessage 对象，
     * 并在末尾追加当前用户消息，实现多轮对话上下文传递
     *
     * @param request 聊天请求
     * @return LangChain4j ChatMessage 列表
     */
    private List<ChatMessage> buildMessages(ChatRequest request) {
        List<ChatMessage> messages = new ArrayList<>();

        // 追加历史上下文消息
        if (request.getContextMessages() != null) {
            for (ChatRequest.ContextMessage ctx : request.getContextMessages()) {
                switch (ctx.getRole()) {
                    case "system":
                        messages.add(SystemMessage.from(ctx.getContent()));
                        break;
                    case "assistant":
                        messages.add(AiMessage.from(ctx.getContent()));
                        break;
                    default:
                        messages.add(UserMessage.from(ctx.getContent()));
                        break;
                }
            }
        }

        // 追加当前用户消息
        messages.add(UserMessage.from(request.getMessage()));

        return messages;
    }
}
