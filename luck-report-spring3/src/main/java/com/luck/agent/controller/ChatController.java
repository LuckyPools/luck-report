package com.luck.agent.controller;

import com.luck.agent.domain.entity.ModelConfig;
import com.luck.agent.domain.vo.ChatRequest;
import com.luck.agent.domain.vo.ContextMessage;
import com.luck.agent.domain.vo.ToolCallMessage;
import com.luck.agent.domain.vo.ToolDefinition;
import com.luck.agent.moudules.modelconfig.service.ModelConfigDataService;
import com.luck.agent.domain.vo.AskModelRequest;
import com.luck.agent.util.ChatUtils;
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

/**
 * 聊天控制器
 * 通过 ChatUtils 调用阿里百炼 OpenAI 兼容 API，实现流式对话转发
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

    private final ModelConfigDataService modelConfigDataService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    /**
     * 初始化聊天控制器
     * 注入 ModelConfigDataService 获取大模型配置
     * HTTP 客户端和 Gson 由 ChatUtils 统一管理
     *
     * @param modelConfigDataService 模型配置数据服务
     */
    public ChatController(ModelConfigDataService modelConfigDataService) {
        this.modelConfigDataService = modelConfigDataService;
    }

    /**
     * 流式对话接口（POST）
     * 接收 JSON 请求体，通过 ChatUtils.buildStreamCall() 构建流式请求，
     * 以 SSE 方式推送流式响应
     * 支持 Function Calling：当请求携带 tools 参数时，将工具定义传给大模型，
     * 大模型可通过 tool_calls 返回工具调用指令，后端解析后以 tool_use 事件推送
     *
     * @param request 聊天请求 DTO，包含消息内容、历史上下文、附件、工具定义、模型ID等
     * @return SSE事件流，包含 message / tool_use / done / error 事件
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody ChatRequest request) {
        SseEmitter emitter = new SseEmitter(120000L);

        executorService.submit(() -> {
            try {
                // 根据modelId获取模型配置，如果未传则使用默认激活的第一个对话模型
                ModelConfig chatConfig = modelConfigDataService.getChatConfig(request.getModelId());
                List<Map<String, Object>> messages = buildMessages(request);

                // 构建工具定义列表（OpenAI Function Calling 格式）
                List<Map<String, Object>> openaiTools = buildOpenAiTools(request.getTools());

                // 流式选项：请求 API 在最后一个 chunk 返回 token 用量
                Map<String, Object> streamOptions = new LinkedHashMap<>(1);
                streamOptions.put("include_usage", true);

                AskModelRequest askRequest = new AskModelRequest(chatConfig, messages)
                        .stream(true)
                        .tools(openaiTools)
                        .toolChoice(openaiTools != null ? "auto" : null)
                        .streamOptions(streamOptions);

                // 计算输入消息的文本总长度，用于 token 估算
                int inputTextLength = 0;
                for (Map<String, Object> msg : messages) {
                    Object msgContent = msg.get("content");
                    if (msgContent != null) {
                        inputTextLength += msgContent.toString().length();
                    }
                }
                final int finalInputTextLength = inputTextLength;

                Call call = ChatUtils.buildStreamCall(askRequest);

                call.enqueue(new Callback() {
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
                            processStreamResponse(source, emitter, finalInputTextLength);
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
     * 流结束时估算 token 用量并以 token_usage 事件推送
     *
     * @param source 响应流的 BufferedSource
     * @param emitter SSE 发射器
     * @param inputTextLength 输入消息的文本总长度，用于 token 估算
     * @throws IOException 读取异常
     */
    @SuppressWarnings("unchecked")
    private void processStreamResponse(BufferedSource source, SseEmitter emitter, int inputTextLength) throws IOException {
        Map<Integer, Map<String, Object>> accumulatedToolCalls = new LinkedHashMap<>();
        int outputTextLength = 0;
        boolean hasRealUsage = false;
        int inputTokens = 0;
        int outputTokens = 0;
        int totalTokens = 0;

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
                flushAccumulatedToolCalls(accumulatedToolCalls, emitter);

                if (!hasRealUsage) {
                    inputTokens = estimateTokens(inputTextLength);
                    outputTokens = estimateTokens(outputTextLength);
                    totalTokens = inputTokens + outputTokens;
                    log.debug("API未返回usage，使用估算: inputTokens={}, outputTokens={}, totalTokens={}",
                            inputTokens, outputTokens, totalTokens);
                }

                Map<String, Object> tokenUsage = new LinkedHashMap<>(3);
                tokenUsage.put("inputTokens", inputTokens);
                tokenUsage.put("outputTokens", outputTokens);
                tokenUsage.put("totalTokens", totalTokens);
                emitter.send(SseEmitter.event().name("token_usage").data(ChatUtils.getGson().toJson(tokenUsage)));

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                return;
            }

            try {
                Map<String, Object> response = ChatUtils.getGson().fromJson(data, Map.class);
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
                    String contentStr = content.toString();
                    outputTextLength += contentStr.length();
                    emitter.send(SseEmitter.event().name("message").data(contentStr));
                }

                // 提取思考内容（qwen3.6-plus 等模型的 reasoning_content 字段）
                Object reasoningContent = delta.get("reasoning_content");
                if (reasoningContent != null && !reasoningContent.toString().isEmpty()) {
                    String reasoningStr = reasoningContent.toString();
                    outputTextLength += reasoningStr.length();
                    emitter.send(SseEmitter.event().name("reasoning_content").data(reasoningStr));
                }

                // 累积 tool_calls 片段
                List<Map<String, Object>> toolCalls = (List<Map<String, Object>>) delta.get("tool_calls");
                if (toolCalls != null) {
                    for (Map<String, Object> tc : toolCalls) {
                        Object indexObj = tc.get("index");
                        int index = indexObj != null ? ((Number) indexObj).intValue() : 0;
                        Map<String, Object> accumulated = accumulatedToolCalls.computeIfAbsent(index, k -> new LinkedHashMap<>());

                        if (tc.containsKey("id")) {
                            accumulated.put("id", tc.get("id"));
                        }
                        if (tc.containsKey("type")) {
                            accumulated.put("type", tc.get("type"));
                        }
                        Map<String, Object> function = (Map<String, Object>) tc.get("function");
                        if (function != null) {
                            Map<String, Object> accFunction = (Map<String, Object>) accumulated.computeIfAbsent("function", k -> new LinkedHashMap<>());
                            if (function.containsKey("name")) {
                                accFunction.put("name", function.get("name"));
                            }
                            if (function.containsKey("arguments")) {
                                String prevArgs = (String) accFunction.getOrDefault("arguments", "");
                                accFunction.put("arguments", prevArgs + function.get("arguments").toString());
                            }
                        }
                    }
                }

                // 检查 finish_reason
                String finishReason = (String) choice.get("finish_reason");
                if ("tool_calls".equals(finishReason)) {
                    flushAccumulatedToolCalls(accumulatedToolCalls, emitter);
                    accumulatedToolCalls.clear();
                }

                // 提取 usage 字段，部分 API 提供商在流式最后一个 chunk 中返回
                Map<String, Object> usage = (Map<String, Object>) response.get("usage");
                if (usage != null) {
                    Object promptTokens = usage.get("prompt_tokens");
                    Object completionTokens = usage.get("completion_tokens");
                    Object totalTokensObj = usage.get("total_tokens");
                    // usage 可能存在但值为 null（如阿里百炼），需判断实际值
                    if (promptTokens != null && completionTokens != null) {
                        hasRealUsage = true;
                        inputTokens = ((Number) promptTokens).intValue();
                        outputTokens = ((Number) completionTokens).intValue();
                        totalTokens = totalTokensObj != null ? ((Number) totalTokensObj).intValue() : inputTokens + outputTokens;
                        log.debug("API返回真实usage: inputTokens={}, outputTokens={}, totalTokens={}", inputTokens, outputTokens, totalTokens);
                    }
                }
            } catch (Exception e) {
                log.warn("解析SSE数据失败: data={}, error={}", data, e.getMessage());
            }
        }

        // 兜底：流耗尽后刷新剩余的 tool_calls
        flushAccumulatedToolCalls(accumulatedToolCalls, emitter);
    }

    /**
     * 基于文本长度估算 token 数
     * Qwen 模型的 token 估算规则：中文约 1.5 字符/token，英文约 4 字符/token
     * 混合内容取中间值约 2 字符/token，加上工具定义等额外开销的 20% 系数
     *
     * @param textLength 文本字符数
     * @return 估算的 token 数
     */
    private int estimateTokens(int textLength) {
        if (textLength <= 0) return 0;
        return (int) Math.ceil(textLength / 2.0 * 1.2);
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
                input = ChatUtils.getGson().fromJson(argumentsStr, Map.class);
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

            String eventJson = ChatUtils.getGson().toJson(toolUseEvent);
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
     * 将前端传入的工具定义转换为 OpenAI Function Calling 格式
     * 前端 ToolDefinition 格式：{ type: "function", function: { name, description, parameters } }
     *
     * @param tools 前端传入的工具定义列表，可为 null
     * @return OpenAI 格式的工具定义列表，无工具时返回 null
     */
    private List<Map<String, Object>> buildOpenAiTools(List<ToolDefinition> tools) {
        if (tools == null || tools.isEmpty()) {
            return null;
        }

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
        return openaiTools;
    }
}
