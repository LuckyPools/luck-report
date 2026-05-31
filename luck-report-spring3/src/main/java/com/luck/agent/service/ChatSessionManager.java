package com.luck.agent.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.agent.prompt.PromptHelper;
import com.luck.agent.tool.ReportTools;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.service.AiServices;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * 聊天会话管理服务
 * 管理每个用户的 AI 助手实例和对话记忆
 * 支持多轮对话和工具调用结果的注入
 *
 * @author luck
 */
@Slf4j
@Service
public class ChatSessionManager {

    private static final String API_KEY = "sk-391c6103719e4169933ebcd160280b12";
    private static final String BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
    private static final String MODEL_NAME = "qwen3.6-plus";

    private static final long TOOL_TIMEOUT_SECONDS = 30;

    private final StreamingChatModel streamingChatModel;
    private final Map<String, SessionContext> sessions = new ConcurrentHashMap<>();
    private final Map<String, ToolResultWaiter> toolResultWaiters = new ConcurrentHashMap<>();
    private final Map<String, SseEmitter> sessionEmitters = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 初始化会话管理器
     * 创建共享的流式聊天模型实例
     */
    public ChatSessionManager() {
        this.streamingChatModel = OpenAiStreamingChatModel.builder()
                .apiKey(API_KEY)
                .baseUrl(BASE_URL)
                .modelName(MODEL_NAME)
                .build();
    }

    /**
     * 注册会话的 SSE 发射器
     *
     * @param sessionId 会话ID
     * @param emitter   SSE 发射器
     */
    public void registerEmitter(String sessionId, SseEmitter emitter) {
        sessionEmitters.put(sessionId, emitter);
        log.info("注册 SSE 发射器: sessionId={}", sessionId);
    }

    /**
     * 注销会话的 SSE 发射器
     *
     * @param sessionId 会话ID
     */
    public void unregisterEmitter(String sessionId) {
        sessionEmitters.remove(sessionId);
        log.info("注销 SSE 发射器: sessionId={}", sessionId);
    }

    /**
     * 获取当前活跃的 SSE 发射器
     * 由于 LangChain4j 在 ForkJoinPool 中执行工具，无法通过 ThreadLocal 传递 sessionId
     * 因此直接获取当前活跃的发射器（适用于单用户场景）
     *
     * @return SSE 发射器，如果没有活跃会话则返回 null
     */
    public SseEmitter getActiveEmitter() {
        if (sessionEmitters.isEmpty()) {
            return null;
        }
        Map.Entry<String, SseEmitter> entry = sessionEmitters.entrySet().iterator().next();
        log.info("获取活跃 SSE 发射器: sessionId={}", entry.getKey());
        return entry.getValue();
    }

    /**
     * 发送工具调用事件给前端
     * 在 Tool 中调用此方法，将指令发送给前端执行
     *
     * @param toolName 工具名称
     * @param args     工具参数
     * @return 工具调用ID，用于等待前端结果
     */
    public String sendToolCallToFrontend(String toolName, Map<String, Object> args) {
        try {
            SseEmitter emitter = getActiveEmitter();
            if (emitter == null) {
                log.error("未找到活跃的 SSE 发射器，无法发送工具调用事件");
                return null;
            }

            String callId = UUID.randomUUID().toString();

            Map<String, Object> toolCall = new HashMap<>();
            toolCall.put("type", "tool_call");
            toolCall.put("name", toolName);
            toolCall.put("callId", callId);
            toolCall.put("args", args);

            String toolCallJson = objectMapper.writeValueAsString(toolCall);
            log.info("发送工具调用事件给前端: callId={}", callId);

            emitter.send(SseEmitter.event()
                    .name("tool_call")
                    .data(toolCallJson));

            registerToolResultWaiter(callId);

            return callId;
        } catch (Exception e) {
            log.error("发送工具调用事件失败", e);
            return null;
        }
    }

    /**
     * 创建新会话
     * 生成唯一的会话ID，并初始化对应的 AI 助手实例
     *
     * @return 新创建的会话ID
     */
    public String createSession() {
        String sessionId = UUID.randomUUID().toString();
        SessionContext context = new SessionContext();
        context.setChatMemory(MessageWindowChatMemory.withMaxMessages(20));
        context.setAssistant(createReportAssistant(context.getChatMemory()));
        sessions.put(sessionId, context);
        log.info("创建新会话: {}", sessionId);
        return sessionId;
    }

    /**
     * 获取会话的 AI 助手实例
     *
     * @param sessionId 会话ID
     * @return AI 助手实例，会话不存在时返回 null
     */
    public ReportAssistant getAssistant(String sessionId) {
        SessionContext context = sessions.get(sessionId);
        return context != null ? context.getAssistant() : null;
    }

    /**
     * 获取会话的对话记忆
     *
     * @param sessionId 会话ID
     * @return 对话记忆实例，会话不存在时返回 null
     */
    public MessageWindowChatMemory getChatMemory(String sessionId) {
        SessionContext context = sessions.get(sessionId);
        return context != null ? context.getChatMemory() : null;
    }

    /**
     * 删除会话
     * 清理会话相关的所有资源
     *
     * @param sessionId 会话ID
     */
    public void removeSession(String sessionId) {
        sessions.remove(sessionId);
        sessionEmitters.remove(sessionId);
        log.info("删除会话: {}", sessionId);
    }

    /**
     * 检查会话是否存在
     *
     * @param sessionId 会话ID
     * @return 会话是否存在
     */
    public boolean hasSession(String sessionId) {
        return sessions.containsKey(sessionId);
    }

    /**
     * 注册工具调用等待器
     * 用于等待前端返回工具执行结果
     *
     * @param callId 工具调用ID
     * @return 等待器实例
     */
    public ToolResultWaiter registerToolResultWaiter(String callId) {
        ToolResultWaiter waiter = new ToolResultWaiter();
        toolResultWaiters.put(callId, waiter);
        log.info("注册工具结果等待器: callId={}", callId);
        return waiter;
    }

    /**
     * 设置工具执行结果
     * 通知等待的线程工具执行已完成
     *
     * @param callId 工具调用ID
     * @param result 工具执行结果
     */
    public void setToolResult(String callId, String result) {
        ToolResultWaiter waiter = toolResultWaiters.remove(callId);
        if (waiter != null) {
            waiter.setResult(result);
            log.info("设置工具执行结果: callId={}, result={}", callId, result);
        } else {
            log.warn("未找到工具结果等待器: callId={}", callId);
        }
    }

    /**
     * 等待工具执行结果
     * 阻塞当前线程直到前端返回结果或超时
     *
     * @param callId 工具调用ID
     * @return 工具执行结果，超时返回 null
     */
    public String waitForToolResult(String callId) {
        ToolResultWaiter waiter = toolResultWaiters.get(callId);
        if (waiter == null) {
            log.warn("未找到等待器，可能已被处理: callId={}", callId);
            return null;
        }
        try {
            String result = waiter.waitForResult(TOOL_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (result == null) {
                log.warn("等待工具结果超时: callId={}", callId);
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("等待工具结果被中断: callId={}", callId, e);
            return null;
        } finally {
            toolResultWaiters.remove(callId);
        }
    }

    /**
     * 创建报表助手实例
     * 使用 AiServices 构建带有工具和记忆的 AI 服务
     *
     * @param chatMemory 对话记忆实例
     * @return 报表助手实例
     */
    private ReportAssistant createReportAssistant(MessageWindowChatMemory chatMemory) {
        String systemPrompt = PromptHelper.buildSystemPrompt(
                "智能报表助手",
                "你是一个专业的报表设计助手，能够帮助用户在浏览器上修改web报表。当用户需要读取或设置单元格数据时，请调用相应的工具。");

        return AiServices.builder(ReportAssistant.class)
                .streamingChatModel(streamingChatModel)
                .tools(new ReportTools(this))
                .chatMemory(chatMemory)
                .systemMessageProvider(memoryId -> systemPrompt)
                .build();
    }

    /**
     * 工具结果等待器
     * 使用 CountDownLatch 实现等待/通知机制
     */
    public static class ToolResultWaiter {
        private final CountDownLatch latch = new CountDownLatch(1);
        private volatile String result;

        /**
         * 设置工具执行结果
         * 通知等待的线程
         *
         * @param result 工具执行结果
         */
        public void setResult(String result) {
            this.result = result;
            latch.countDown();
        }

        /**
         * 等待工具执行结果
         *
         * @param timeout 超时时间
         * @param unit    时间单位
         * @return 工具执行结果，超时返回 null
         * @throws InterruptedException 等待被中断
         */
        public String waitForResult(long timeout, TimeUnit unit) throws InterruptedException {
            if (latch.await(timeout, unit)) {
                return result;
            }
            return null;
        }
    }

    /**
     * 会话上下文
     * 保存单个会话的 AI 助手实例和对话记忆
     */
    private static class SessionContext {
        private ReportAssistant assistant;
        private MessageWindowChatMemory chatMemory;

        public ReportAssistant getAssistant() {
            return assistant;
        }

        public void setAssistant(ReportAssistant assistant) {
            this.assistant = assistant;
        }

        public MessageWindowChatMemory getChatMemory() {
            return chatMemory;
        }

        public void setChatMemory(MessageWindowChatMemory chatMemory) {
            this.chatMemory = chatMemory;
        }
    }
}
