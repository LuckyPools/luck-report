package com.luck.agent.controller;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.luck.agent.domain.entity.ModelConfig;
import com.luck.agent.domain.vo.ChatRequest;
import com.luck.agent.domain.vo.ContextMessage;
import com.luck.agent.domain.vo.ToolCallMessage;
import com.luck.agent.domain.vo.ToolDefinition;
import com.luck.agent.service.ModelConfigService;
import okhttp3.*;
import okio.BufferedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * 聊天控制器
 * 通过 OkHttp 直接调用阿里百炼 OpenAI 兼容 API，实现流式对话转发
 * 支持 Function Calling：将前端传入的 tools 定义转发给大模型，
 * 解析大模型返回的 tool_calls 并通过 SSE tool_use 事件推送给前端，
 * 前端执行工具后将 tool_result 回传，实现 Agentic Loop
 *
 * @author luck
 */
@RestController
@RequestMapping("/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final ModelConfigService modelConfigService;
    private final OkHttpClient httpClient;
    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private final Gson gson = new GsonBuilder().create();

    /**
     * 初始化聊天控制器
     * 注入 ModelConfigService 获取大模型配置，构建 OkHttp 客户端
     *
     * @param modelConfigService 模型配置服务
     */
    public ChatController(ModelConfigService modelConfigService) {
        this.modelConfigService = modelConfigService;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    /**
     * 流式对话接口（POST）
     * 接收 JSON 请求体，转发至大模型 API 并以 SSE 方式推送流式响应
     * 支持 Function Calling：当请求携带 tools 参数时，将工具定义传给大模型，
     * 大模型可通过 tool_calls 返回工具调用指令，后端解析后以 tool_use 事件推送
     *
     * @param request 聊天请求 DTO，包含消息内容、历史上下文、附件、工具定义等
     * @return SSE事件流，包含 message / tool_use / done / error 事件
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody ChatRequest request) {
        SseEmitter emitter = new SseEmitter(120000L);

        executorService.submit(() -> {
            try {
                // 从 ModelConfigService 获取对话模型配置
                ModelConfig chatConfig = modelConfigService.getChatConfig(null);
                String baseUrl = chatConfig.getBaseUrl();
                String apiKey = chatConfig.getApiKey();
                String modelName = chatConfig.getModelName();

                List<Map<String, Object>> messages = buildMessages(request);
                String requestBody = buildOpenAiRequestBody(messages, request.getTools(), modelName);

                log.debug("发送给大模型的请求体: {}", requestBody);

                Request httpRequest = new Request.Builder()
                        .url(baseUrl + chatConfig.getCompletionsPath())
                        .addHeader("Authorization", "Bearer " + apiKey)
                        .addHeader("Content-Type", "application/json")
                        .post(okhttp3.RequestBody.create(requestBody, okhttp3.MediaType.parse("application/json")))
                        .build();

                httpClient.newCall(httpRequest).enqueue(new Callback() {
                    @Override
                    public void onFailure(Call call, IOException e) {
                        log.error("大模型API调用失败: {}", e.getMessage(), e);
                        try {
                            emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                            emitter.completeWithError(e);
                        } catch (Exception ex) {
                            emitter.completeWithError(ex);
                        }
                    }

                    @Override
                    public void onResponse(Call call, Response response) throws IOException {
                        if (!response.isSuccessful()) {
                            String errorMsg = response.body() != null ? response.body().string() : "未知错误";
                            log.error("大模型API返回错误: status={}, body={}", response.code(), errorMsg);
                            try {
                                emitter.send(SseEmitter.event().name("error").data("API错误: " + response.code()));
                                emitter.completeWithError(new RuntimeException(errorMsg));
                            } catch (Exception ex) {
                                emitter.completeWithError(ex);
                            }
                            return;
                        }

                        ResponseBody body = response.body();
                        if (body == null) {
                            emitter.completeWithError(new RuntimeException("响应体为空"));
                            return;
                        }

                        BufferedSource source = body.source();
                        try {
                            processStreamResponse(source, emitter);
                            emitter.complete();
                        } catch (Exception e) {
                            log.error("SSE流处理异常: {}", e.getMessage(), e);
                            emitter.completeWithError(e);
                        } finally {
                            body.close();
                        }
                    }
                });
            } catch (Exception e) {
                log.error("构建请求失败: {}", e.getMessage(), e);
                emitter.completeWithError(e);
            }
        });

        emitter.onCompletion(() -> {});
        emitter.onTimeout(() -> emitter.complete());

        return emitter;
    }

    /**
     * 处理大模型流式响应
     * 逐行解析 SSE 数据，提取文本增量和 tool_calls 事件
     * 文本内容以 message 事件推送，tool_calls 以 tool_use 事件推送
     *
     * @param source 响应流的 BufferedSource
     * @param emitter SSE 发射器
     * @throws IOException 读取异常
     */
    @SuppressWarnings("unchecked")
    private void processStreamResponse(BufferedSource source, SseEmitter emitter) throws IOException {
        // 累积 tool_calls 片段，因为 tool_calls 可能跨多个 SSE chunk 分片返回
        // key: tool_call index, value: 累积的 tool_call 片段
        Map<Integer, Map<String, Object>> accumulatedToolCalls = new LinkedHashMap<>();

        while (!source.exhausted()) {
            String line = source.readUtf8Line();
            if (line == null || line.isEmpty()) {
                continue;
            }

            if (!line.startsWith("data: ")) {
                continue;
            }

            String data = line.substring(6).trim();

            if ("[DONE]".equals(data)) {
                // 流结束前，将累积的 tool_calls 一次性推送
                flushAccumulatedToolCalls(accumulatedToolCalls, emitter);
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                return;
            }

            try {
                Map<String, Object> response = gson.fromJson(data, Map.class);
                if (response == null) {
                    continue;
                }

                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (choices == null || choices.isEmpty()) {
                    continue;
                }

                Map<String, Object> choice = choices.get(0);
                Map<String, Object> delta = (Map<String, Object>) choice.get("delta");

                if (delta == null) {
                    continue;
                }

                // 提取文本增量内容
                Object content = delta.get("content");
                if (content != null && !content.toString().isEmpty()) {
                    emitter.send(SseEmitter.event().name("message").data(content.toString()));
                }

                // 累积 tool_calls 片段
                List<Map<String, Object>> toolCalls = (List<Map<String, Object>>) delta.get("tool_calls");
                if (toolCalls != null) {
                    for (Map<String, Object> tc : toolCalls) {
                        Object indexObj = tc.get("index");
                        int index = indexObj != null ? ((Number) indexObj).intValue() : 0;
                        Map<String, Object> accumulated = accumulatedToolCalls.computeIfAbsent(index, k -> new LinkedHashMap<>());

                        // 合并 id
                        if (tc.containsKey("id")) {
                            accumulated.put("id", tc.get("id"));
                        }
                        // 合并 type
                        if (tc.containsKey("type")) {
                            accumulated.put("type", tc.get("type"));
                        }
                        // 合并 function 片段
                        Map<String, Object> function = (Map<String, Object>) tc.get("function");
                        if (function != null) {
                            Map<String, Object> accFunction = (Map<String, Object>) accumulated.computeIfAbsent("function", k -> new LinkedHashMap<>());
                            if (function.containsKey("name")) {
                                accFunction.put("name", function.get("name"));
                            }
                            // arguments 是增量拼接的，需要累加
                            if (function.containsKey("arguments")) {
                                String prevArgs = (String) accFunction.getOrDefault("arguments", "");
                                accFunction.put("arguments", prevArgs + function.get("arguments").toString());
                            }
                        }
                    }
                }

                // 检查 finish_reason，当为 tool_calls 时立即刷新
                String finishReason = (String) choice.get("finish_reason");
                if ("tool_calls".equals(finishReason)) {
                    flushAccumulatedToolCalls(accumulatedToolCalls, emitter);
                    accumulatedToolCalls.clear();
                }
            } catch (Exception e) {
                log.warn("解析SSE数据失败: data={}, error={}", data, e.getMessage());
            }
        }

        // 兜底：流耗尽后刷新剩余的 tool_calls
        flushAccumulatedToolCalls(accumulatedToolCalls, emitter);
    }

    /**
     * 将累积的 tool_calls 刷新为 tool_use SSE 事件推送给前端
     * 每个 tool_call 转换为前端 Agent 期望的 SseToolCall 格式：
     * { toolCallId, toolName, input }
     *
     * @param accumulatedToolCalls 累积的 tool_calls 映射
     * @param emitter SSE 发射器
     * @throws IOException SSE 发送异常
     */
    @SuppressWarnings("unchecked")
    private void flushAccumulatedToolCalls(Map<Integer, Map<String, Object>> accumulatedToolCalls, SseEmitter emitter) throws IOException {
        for (Map<String, Object> tc : accumulatedToolCalls.values()) {
            String toolCallId = (String) tc.get("id");
            Map<String, Object> function = (Map<String, Object>) tc.get("function");
            if (function == null) {
                continue;
            }

            String toolName = (String) function.get("name");
            String argumentsStr = (String) function.getOrDefault("arguments", "{}");

            // 解析 arguments JSON 字符串为 Map
            Map<String, Object> input;
            try {
                input = gson.fromJson(argumentsStr, Map.class);
            } catch (Exception e) {
                log.warn("解析tool_call arguments失败: {}", argumentsStr);
                input = new HashMap<>();
            }

            // 构建前端 Agent 期望的 tool_use 事件格式
            // toolCallId 不能为空，否则前端无法关联 tool_result
            Map<String, Object> toolUseEvent = new LinkedHashMap<>(3);
            String effectiveToolCallId = (toolCallId != null && !toolCallId.isEmpty())
                ? toolCallId
                : UUID.randomUUID().toString();
            toolUseEvent.put("toolCallId", effectiveToolCallId);
            toolUseEvent.put("toolName", toolName);
            toolUseEvent.put("input", input);

            String eventJson = gson.toJson(toolUseEvent);
            log.debug("推送tool_use事件: {}", eventJson);
            emitter.send(SseEmitter.event().name("tool_use").data(eventJson));
        }
    }

    /**
     * 根据请求参数构建 OpenAI API 消息列表
     * 将前端传入的 contextMessages 转换为 OpenAI 格式的消息对象，
     * 支持 user / assistant / system / tool 四种角色，
     * 并在末尾追加当前用户消息（仅当 message 非空时），实现多轮对话上下文传递
     *
     * OpenAI Function Calling 协议要求：
     * - assistant 消息携带 tool_calls 时，必须包含完整的 tool_calls 数组
     * - tool_result 角色映射为 OpenAI 的 tool 角色，必须携带 tool_call_id
     *
     * @param request 聊天请求
     * @return OpenAI 格式的消息列表
     */
    private List<Map<String, Object>> buildMessages(ChatRequest request) {
        List<Map<String, Object>> messages = new ArrayList<>();

        // 追加历史上下文消息
        if (request.getContextMessages() != null) {
            for (ContextMessage ctx : request.getContextMessages()) {
                // tool_result 角色映射为 OpenAI 的 tool 角色
                if ("tool_result".equals(ctx.getRole())) {
                    Map<String, Object> toolMsg = new LinkedHashMap<>(3);
                    toolMsg.put("role", "tool");
                    toolMsg.put("content", ctx.getContent());
                    // OpenAI 要求 tool 消息必须携带 tool_call_id
                    toolMsg.put("tool_call_id", ctx.getToolCallId() != null ? ctx.getToolCallId() : "");
                    messages.add(toolMsg);
                } else if ("assistant".equals(ctx.getRole()) && ctx.getToolCalls() != null && !ctx.getToolCalls().isEmpty()) {
                    // assistant 消息携带 tool_calls 时，必须包含完整的 tool_calls 数组
                    // OpenAI 协议要求：回传 assistant 消息时保留 tool_calls 信息
                    Map<String, Object> assistantMsg = new LinkedHashMap<>(3);
                    assistantMsg.put("role", "assistant");
                    assistantMsg.put("content", ctx.getContent() != null ? ctx.getContent() : "");
                    // 将前端传入的 toolCalls 转换为 OpenAI 格式
                    List<Map<String, Object>> toolCallsList = new ArrayList<>();
                    for (ToolCallMessage tc : ctx.getToolCalls()) {
                        Map<String, Object> tcMap = new LinkedHashMap<>(3);
                        tcMap.put("id", tc.getId());
                        tcMap.put("type", tc.getType() != null ? tc.getType() : "function");
                        Map<String, Object> funcMap = new LinkedHashMap<>(2);
                        funcMap.put("name", tc.getFunction().getName());
                        funcMap.put("arguments", tc.getFunction().getArguments());
                        tcMap.put("function", funcMap);
                        toolCallsList.add(tcMap);
                    }
                    assistantMsg.put("tool_calls", toolCallsList);
                    messages.add(assistantMsg);
                } else {
                    Map<String, Object> msg = new LinkedHashMap<>(2);
                    msg.put("role", ctx.getRole());
                    msg.put("content", ctx.getContent());
                    messages.add(msg);
                }
            }
        }

        // 仅当 message 非空时追加当前用户消息
        // Agent 循环中 message 可能为空（用户消息已包含在 contextMessages 中）
        if (request.getMessage() != null && !request.getMessage().isEmpty()) {
            Map<String, Object> userMsg = new LinkedHashMap<>(2);
            userMsg.put("role", "user");
            userMsg.put("content", request.getMessage());
            messages.add(userMsg);
        }

        return messages;
    }

    /**
     * 构建 OpenAI Chat Completions API 请求体
     * 包含模型名称、消息列表、流式开关、工具定义等参数
     * 当请求携带 tools 时，转换为 OpenAI Function Calling 格式传入
     *
     * @param messages OpenAI 格式消息列表
     * @param tools 前端传入的工具定义列表，可为 null
     * @param modelName 模型名称
     * @return JSON 格式的请求体字符串
     */
    private String buildOpenAiRequestBody(List<Map<String, Object>> messages, List<ToolDefinition> tools,
                                          String modelName) {
        Map<String, Object> body = new LinkedHashMap<>(6);
        body.put("model", modelName);
        body.put("messages", messages);
        body.put("stream", true);

        // 将前端传入的工具定义转换为 OpenAI Function Calling 格式
        if (tools != null && !tools.isEmpty()) {
            List<Map<String, Object>> openaiTools = new ArrayList<>();
            for (ToolDefinition td : tools) {
                Map<String, Object> tool = new LinkedHashMap<>(2);
                tool.put("type", "function");

                Map<String, Object> function = new LinkedHashMap<>(3);
                function.put("name", td.getFunction().getName());
                function.put("description", td.getFunction().getDescription());
                // 前端传入的 inputSchema 映射为 OpenAI 的 parameters
                function.put("parameters", td.getFunction().getParameters());

                tool.put("function", function);
                openaiTools.add(tool);
            }
            body.put("tools", openaiTools);
            // 启用工具调用，让模型自动决定是否调用工具
            body.put("tool_choice", "auto");
        }

        return gson.toJson(body);
    }
}
