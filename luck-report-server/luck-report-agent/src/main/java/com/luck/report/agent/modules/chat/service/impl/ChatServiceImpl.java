package com.luck.report.agent.modules.chat.service.impl;

import com.luck.report.agent.modules.chat.domain.vo.*;
import com.luck.report.agent.modules.chat.service.ChatService;
import com.luck.report.agent.modules.chat.utils.ChatUtils;
import com.luck.report.agent.modules.modelConfig.domain.entity.ModelConfig;
import com.luck.report.agent.modules.modelConfig.service.ModelConfigDataService;
import com.luck.report.common.domain.vo.ResultVO;
import lombok.AllArgsConstructor;
import okhttp3.*;
import okio.BufferedSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 聊天对话服务实现
 * 处理流式对话转发和对话压缩的核心业务逻辑
 *
 * @author luck
 */
@Service
@AllArgsConstructor
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final ModelConfigDataService modelConfigDataService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    /**
     * 流式对话
     * 通过 ChatUtils 构建流式请求，以 SSE 方式推送响应
     * 支持 Function Calling：当请求携带 tools 参数时，将工具定义传给大模型，
     * 大模型可通过 tool_calls 返回工具调用指令，后端解析后以 tool_use 事件推送
     *
     * @param request 聊天请求 DTO，包含消息内容、历史上下文、附件、工具定义、模型ID等
     * @return SSE事件流，包含 message / tool_use / done / error 事件
     */
    @Override
    public SseEmitter chatStream(ChatRequest request) {
        SseEmitter emitter = new SseEmitter(300000L);

        executorService.submit(() -> {
            try {
                // 根据modelId获取模型配置，如果未传则使用默认激活的第一个对话模型
                ModelConfig chatConfig = modelConfigDataService.getChatConfig(request.getModelId());
                List<Map<String, Object>> messages = buildMessages(request);

                // 构建工具定义列表（OpenAI Function Calling 格式）
                List<Map<String, Object>> openaiTools = buildOpenAiTools(request.getTools());

                // 确定工具调用策略：优先使用前端指定的 toolChoice，否则根据是否有工具自动决定
                Object effectiveToolChoice = request.getToolChoice();
                if (effectiveToolChoice == null && openaiTools != null) {
                    effectiveToolChoice = "auto";
                }

                log.info("[ChatService] 意图分析请求: tools数量={}, toolChoice={}, effectiveToolChoice={}",
                        request.getTools() != null ? request.getTools().size() : 0,
                        request.getToolChoice(), effectiveToolChoice);

                // 流式选项：请求 API 在最后一个 chunk 返回 token 用量
                Map<String, Object> streamOptions = new LinkedHashMap<>(1);
                streamOptions.put("include_usage", true);

                AskModelRequest askRequest = new AskModelRequest(chatConfig, messages)
                        .stream(true)
                        .tools(openaiTools)
                        .toolChoice(effectiveToolChoice)
                        .streamOptions(streamOptions)
                        .deepThink(request.getDeepThink());

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

                // 使用 AtomicBoolean 标记 emitter 是否已完成（超时/完成/错误），
                // 避免向已关闭的 emitter 写入数据
                java.util.concurrent.atomic.AtomicBoolean emitterCompleted = new java.util.concurrent.atomic.AtomicBoolean(false);

                call.enqueue(new Callback() {
                    @Override
                    public void onFailure(Call call, IOException e) {
                        if (emitterCompleted.getAndSet(true)) return;
                        log.error("大模型API调用失败: {}", e.getMessage(), e);
                        try {
                            emitter.send(SseEmitter.event().name("error").data("大模型API调用失败: " + e.getMessage()));
                            emitter.complete();
                        } catch (Exception ex) {
                            emitter.complete();
                        }
                    }

                    @Override
                    public void onResponse(Call call, Response response) throws IOException {
                        log.info("[ChatService] API响应: status={}, hasBody={}", response.code(), response.body() != null);
                        if (!response.isSuccessful()) {
                            if (emitterCompleted.getAndSet(true)) return;
                            String errorMsg = response.body() != null ? response.body().string() : "未知错误";
                            log.error("大模型API返回错误: status={}, body={}", response.code(), errorMsg);
                            try {
                                emitter.send(SseEmitter.event().name("error").data("API错误: " + response.code() + ", " + errorMsg));
                                emitter.complete();
                            } catch (Exception ex) {
                                emitter.complete();
                            }
                            return;
                        }

                        ResponseBody body = response.body();
                        if (body == null) {
                            if (emitterCompleted.getAndSet(true)) return;
                            try {
                                emitter.send(SseEmitter.event().name("error").data("响应体为空"));
                                emitter.complete();
                            } catch (Exception e) {
                                emitter.complete();
                            }
                            return;
                        }

                        BufferedSource source = body.source();
                        try {
                            log.info("[ChatService] 开始处理SSE流...");
                            processStreamResponse(source, emitter, finalInputTextLength, emitterCompleted);
                            log.info("[ChatService] SSE流处理完成");
                            if (emitterCompleted.compareAndSet(false, true)) {
                                emitter.complete();
                            }
                        } catch (Exception e) {
                            if (emitterCompleted.getAndSet(true)) return;
                            log.error("SSE流处理异常: {}", e.getMessage(), e);
                            try {
                                emitter.send(SseEmitter.event().name("error").data("流处理异常: " + e.getMessage()));
                                emitter.complete();
                            } catch (Exception ex) {
                                emitter.complete();
                            }
                        } finally {
                            body.close();
                        }
                    }
                });

                // emitter 超时或完成时，取消 OkHttp Call 以停止接收 LLM 数据
                emitter.onCompletion(() -> {
                    emitterCompleted.set(true);
                    if (!call.isCanceled()) {
                        call.cancel();
                    }
                });
                emitter.onTimeout(() -> {
                    log.warn("SseEmitter超时，取消LLM请求");
                    emitterCompleted.set(true);
                    if (!call.isCanceled()) {
                        call.cancel();
                    }
                    emitter.complete();
                });

            } catch (Exception e) {
                log.error("构建请求失败: {}", e.getMessage(), e);
                try {
                    emitter.send(SseEmitter.event().name("error").data("构建请求失败: " + e.getMessage()));
                    emitter.complete();
                } catch (Exception ex) {
                    emitter.complete();
                }
            }
        });

        return emitter;
    }

    /**
     * 对话压缩
     * 接收早期对话消息，通过 ChatUtils.askModel() 调用 LLM 生成结构化摘要，
     * 替代原始消息以减少上下文 token 消耗
     *
     * @param request 压缩请求，包含 messages、existingSummary、reportSnapshot、compactPrompt、modelId 等
     * @return ResultVO<CompactResult> 压缩结果，包含 summary 和 keyOperations
     */
    @Override
    public ResultVO<CompactResult> compact(CompactRequest request) {
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            return ResultVO.error("压缩消息列表为空");
        }

        if (request.getCompactPrompt() == null || request.getCompactPrompt().isEmpty()) {
            return ResultVO.error("压缩提示词不能为空，请由前端传入 compactPrompt");
        }

        try {
            // 根据modelId获取模型配置，如果未传则使用默认激活的第一个对话模型
            ModelConfig chatConfig = modelConfigDataService.getChatConfig(request.getModelId());
            List<Map<String, Object>> messages = buildCompactMessages(request);

            AskModelRequest askRequest = new AskModelRequest(chatConfig, messages)
                    .stream(false)
                    .temperature(0.3)
                    .maxTokens(1024);

            AskModelResponse askResponse = ChatUtils.askModel(askRequest);

            if (!askResponse.isSuccess()) {
                log.error("压缩API调用失败: status={}", askResponse.getStatusCode());
                return ResultVO.error("压缩API调用失败: " + askResponse.getStatusCode());
            }

            CompactResult result = parseCompactResult(askResponse.getBody());

            if (result == null) {
                log.warn("压缩结果解析失败，使用规则压缩兜底");
                result = fallbackCompact(request);
            }

            log.info("对话压缩完成: summary长度={}, keyOperations数量={}",
                    result.getSummary() != null ? result.getSummary().length() : 0,
                    result.getKeyOperations() != null ? result.getKeyOperations().size() : 0);

            return ResultVO.success(result);
        } catch (Exception e) {
            log.error("对话压缩异常: {}", e.getMessage(), e);
            return ResultVO.error("对话压缩失败: " + e.getMessage());
        }
    }

    // ==================== 流式对话相关私有方法 ====================

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
    private void processStreamResponse(BufferedSource source, SseEmitter emitter, int inputTextLength,
                                           java.util.concurrent.atomic.AtomicBoolean emitterCompleted) throws IOException {
        Map<Integer, Map<String, Object>> accumulatedToolCalls = new LinkedHashMap<>();
        int outputTextLength = 0;
        boolean hasRealUsage = false;
        int inputTokens = 0;
        int outputTokens = 0;
        int totalTokens = 0;

        while (!source.exhausted()) {
            // 如果 emitter 已完成（超时/客户端断开），停止处理
            if (emitterCompleted.get()) {
                return;
            }

            String line = source.readUtf8Line();
            if (line == null || line.isEmpty()) {
                continue;
            }

            // 临时排查：打印所有非空行，确认 API 返回的 SSE 格式
            log.debug("[ChatService] SSE行: {}", line.length() > 300 ? line.substring(0, 300) + "..." : line);

            if (!line.startsWith("data: ")) {
                continue;
            }

            String data = line.substring(6).trim();

            if ("[DONE]".equals(data)) {
                log.info("[ChatService] SSE流结束, outputTextLength={}, toolCalls数量={}, hasRealUsage={}",
                        outputTextLength, accumulatedToolCalls.size(), hasRealUsage);
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
                emitter.send(SseEmitter.event().name("token_usage").data(ChatUtils.getObjectMapper().writeValueAsString(tokenUsage)));

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                return;
            }

            try {
                Map<String, Object> response = ChatUtils.getObjectMapper().readValue(data, Map.class);
                if (response == null) {
                    continue;
                }

                // 检查 API 返回的错误响应（如 max_tokens 超限等参数错误）
                Map<String, Object> errorInfo = (Map<String, Object>) response.get("error");
                if (errorInfo != null) {
                    String errorMsg = errorInfo.getOrDefault("message", "未知API错误").toString();
                    log.error("[ChatService] LLM API返回错误: {}", errorMsg);
                    emitter.send(SseEmitter.event().name("error").data("LLM API错误: " + errorMsg));
                    return;
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

                        // 流式返回时，后续 chunk 可能包含空字符串的 id/type，只在非空时覆盖
                        if (tc.containsKey("id")) {
                            Object id = tc.get("id");
                            if (id != null && !id.toString().isEmpty()) {
                                accumulated.put("id", id);
                            }
                        }
                        if (tc.containsKey("type")) {
                            Object type = tc.get("type");
                            if (type != null && !type.toString().isEmpty()) {
                                accumulated.put("type", type);
                            }
                        }
                        Map<String, Object> function = (Map<String, Object>) tc.get("function");
                        if (function != null) {
                            Map<String, Object> accFunction = (Map<String, Object>) accumulated.computeIfAbsent("function", k -> new LinkedHashMap<>());
                            // 流式返回时，后续 chunk 可能包含空字符串的 name，只在非空时覆盖
                            if (function.containsKey("name")) {
                                Object name = function.get("name");
                                if (name != null && !name.toString().isEmpty()) {
                                    accFunction.put("name", name);
                                }
                            }
                            if (function.containsKey("arguments")) {
                                // 流式返回时，第一个 chunk 的 arguments 可能为 null，需判断
                                Object argsObj = function.get("arguments");
                                if (argsObj != null) {
                                    String prevArgs = (String) accFunction.getOrDefault("arguments", "");
                                    accFunction.put("arguments", prevArgs + argsObj.toString());
                                }
                            }
                        }
                    }
                    // 打印累积后的 tool_calls 状态
                    log.info("[ChatService] 累积tool_calls后: 数量={}, 当前累积内容={}",
                            accumulatedToolCalls.size(),
                            accumulatedToolCalls.values().stream()
                                    .map(tc -> {
                                        Map<String, Object> func = (Map<String, Object>) tc.get("function");
                                        String name = func != null ? (String) func.get("name") : "null";
                                        String args = func != null ? (String) func.get("arguments") : "null";
                                        return String.format("{id=%s, name=%s, argsLen=%d}",
                                                tc.get("id"), name, args != null ? args.length() : 0);
                                    })
                                    .collect(java.util.stream.Collectors.joining(", ")));
                }

                // 检查 finish_reason
                String finishReason = (String) choice.get("finish_reason");
                if (finishReason != null || delta.containsKey("tool_calls")) {
                    log.info("[ChatService] SSE chunk: finishReason={}, has_tool_calls={}",
                            finishReason, delta.containsKey("tool_calls"));
                }
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
                log.warn("解析SSE数据失败: data={}, error={}", data.length() > 200 ? data.substring(0, 200) + "..." : data, e.getMessage());
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
        log.info("[ChatService] flushAccumulatedToolCalls: 累积的tool_calls数量={}", accumulatedToolCalls.size());
        for (Map.Entry<Integer, Map<String, Object>> entry : accumulatedToolCalls.entrySet()) {
            Map<String, Object> tc = entry.getValue();
            String toolCallId = (String) tc.get("id");
            Map<String, Object> function = (Map<String, Object>) tc.get("function");
            if (function == null) {
                log.warn("[ChatService] tool_call function为空, index={}", entry.getKey());
                continue;
            }

            String toolName = (String) function.get("name");
            String argumentsStr = (String) function.getOrDefault("arguments", "{}");
            log.info("[ChatService] 准备发送tool_use事件: toolCallId={}, toolName={}, arguments长度={}",
                    toolCallId, toolName, argumentsStr != null ? argumentsStr.length() : 0);

            // 解析 arguments JSON 字符串为 Map
            Map<String, Object> input;
            try {
                input = ChatUtils.getObjectMapper().readValue(argumentsStr, Map.class);
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

            String eventJson = ChatUtils.getObjectMapper().writeValueAsString(toolUseEvent);
            log.info("[ChatService] 发送tool_use事件: {}", eventJson);
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

    // ==================== 对话压缩相关私有方法 ====================

    /**
     * 构建压缩请求的消息列表
     * 组装 system prompt + 用户消息，供 ChatUtils.askModel() 使用
     *
     * @param request 压缩请求
     * @return OpenAI 格式的消息列表
     */
    private List<Map<String, Object>> buildCompactMessages(CompactRequest request) {
        List<Map<String, Object>> messages = new ArrayList<>();

        // 系统提示词：由前端管理并传入
        Map<String, Object> systemMsg = new LinkedHashMap<>(2);
        systemMsg.put("role", "system");
        systemMsg.put("content", request.getCompactPrompt());
        messages.add(systemMsg);

        // 构建用户消息：已有摘要 + 报表快照 + 待压缩的对话历史
        StringBuilder userContent = new StringBuilder();

        if (request.getExistingSummary() != null && !request.getExistingSummary().isEmpty()) {
            userContent.append("[已有的对话摘要]\n").append(request.getExistingSummary()).append("\n\n");
        }

        if (request.getReportSnapshot() != null && !request.getReportSnapshot().isEmpty()) {
            userContent.append("[当前报表状态快照]\n").append(request.getReportSnapshot()).append("\n\n");
        }

        if (request.getExistingKeyOperations() != null && !request.getExistingKeyOperations().isEmpty()) {
            userContent.append("[已有的关键操作记录]\n");
            for (String op : request.getExistingKeyOperations()) {
                userContent.append("- ").append(op).append("\n");
            }
            userContent.append("\n");
        }

        userContent.append("[需要压缩的对话历史]\n");
        for (ContextMessage ctx : request.getMessages()) {
            String roleLabel;
            if ("user".equals(ctx.getRole())) {
                roleLabel = "用户";
            } else if ("assistant".equals(ctx.getRole())) {
                roleLabel = "助手";
            } else if ("tool_result".equals(ctx.getRole())) {
                roleLabel = "工具结果(" + (ctx.getToolName() != null ? ctx.getToolName() : "unknown") + ")";
            } else {
                roleLabel = ctx.getRole();
            }
            String content = ctx.getContent();
            // 工具结果过长时截断，避免压缩请求本身 token 过多
            if (content != null && content.length() > 500) {
                content = content.substring(0, 300) + "\n...[截断]...\n" + content.substring(content.length() - 100);
            }
            userContent.append(roleLabel).append(": ").append(content).append("\n");
        }

        userContent.append("\n请基于以上信息生成压缩后的摘要和关键操作列表。");

        Map<String, Object> userMsg = new LinkedHashMap<>(2);
        userMsg.put("role", "user");
        userMsg.put("content", userContent.toString());
        messages.add(userMsg);

        return messages;
    }

    /**
     * 解析 LLM 压缩结果
     * 从 OpenAI 格式的非流式响应中提取 JSON 摘要
     *
     * @param responseBody API 响应体
     * @return CompactResult 或 null（解析失败时）
     */
    @SuppressWarnings("unchecked")
    private CompactResult parseCompactResult(String responseBody) {
        try {
            Map<String, Object> response = ChatUtils.getObjectMapper().readValue(responseBody, Map.class);
            if (response == null) return null;

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) return null;

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            if (message == null) return null;

            String content = (String) message.get("content");
            if (content == null || content.isEmpty()) return null;

            // 替换中文引号为英文引号，防止 LLM 输出中文引号导致 JSON 解析失败
            content = content.replace('\u201C', '"').replace('\u201D', '"')
                             .replace('\u2018', '\'').replace('\u2019', '\'');

            // 尝试从 content 中提取 JSON（LLM 可能在 JSON 前后加 markdown 标记）
            String jsonStr = extractJson(content);
            if (jsonStr == null) return null;

            Map<String, Object> result = ChatUtils.getObjectMapper().readValue(jsonStr, Map.class);
            if (result == null) return null;

            CompactResult compactResult = new CompactResult();
            compactResult.setSummary((String) result.get("summary"));

            List<String> keyOps = new ArrayList<>();
            Object keyOpsObj = result.get("keyOperations");
            if (keyOpsObj instanceof List) {
                for (Object item : (List<?>) keyOpsObj) {
                    keyOps.add(String.valueOf(item));
                }
            }
            compactResult.setKeyOperations(keyOps);

            // 校验摘要不为空
            if (compactResult.getSummary() == null || compactResult.getSummary().isEmpty()) {
                return null;
            }

            return compactResult;
        } catch (Exception e) {
            log.warn("解析压缩结果异常: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从 LLM 输出中提取 JSON 字符串
     * LLM 可能返回 ```json ... ``` 包裹的内容，需要提取纯 JSON
     *
     * @param content LLM 输出内容
     * @return 提取的 JSON 字符串，提取失败返回 null
     */
    private String extractJson(String content) {
        // 尝试提取 ```json ... ``` 包裹的内容
        int jsonStart = content.indexOf("```json");
        if (jsonStart >= 0) {
            int jsonEnd = content.indexOf("```", jsonStart + 7);
            if (jsonEnd > jsonStart) {
                return content.substring(jsonStart + 7, jsonEnd).trim();
            }
        }

        // 尝试提取 ``` ... ``` 包裹的内容
        int codeStart = content.indexOf("```");
        if (codeStart >= 0) {
            int codeEnd = content.indexOf("```", codeStart + 3);
            if (codeEnd > codeStart) {
                String inner = content.substring(codeStart + 3, codeEnd).trim();
                // 跳过可能的语言标记行
                int braceStart = inner.indexOf('{');
                if (braceStart >= 0) {
                    return inner.substring(braceStart);
                }
            }
        }

        // 尝试直接找 JSON 对象
        int braceStart = content.indexOf('{');
        int braceEnd = content.lastIndexOf('}');
        if (braceStart >= 0 && braceEnd > braceStart) {
            return content.substring(braceStart, braceEnd + 1);
        }

        return null;
    }

    /**
     * 规则压缩兜底方案
     * 当 LLM 压缩失败时，使用简单的规则提取关键信息
     *
     * @param request 压缩请求
     * @return 规则压缩的结果
     */
    private CompactResult fallbackCompact(CompactRequest request) {
        StringBuilder summary = new StringBuilder();
        List<String> keyOps = new ArrayList<>();

        if (request.getExistingSummary() != null && !request.getExistingSummary().isEmpty()) {
            summary.append(request.getExistingSummary()).append("\n\n[后续摘要]\n");
        }

        for (ContextMessage ctx : request.getMessages()) {
            if ("user".equals(ctx.getRole()) && ctx.getContent() != null) {
                summary.append("用户: ").append(ctx.getContent(), 0, Math.min(ctx.getContent().length(), 100)).append("\n");
            } else if ("assistant".equals(ctx.getRole()) && ctx.getContent() != null && !ctx.getContent().isEmpty()) {
                summary.append("助手: ").append(ctx.getContent(), 0, Math.min(ctx.getContent().length(), 100)).append("\n");
            } else if ("tool_result".equals(ctx.getRole()) && ctx.getToolName() != null) {
                keyOps.add(ctx.getToolName() + ": " + (ctx.getContent() != null ? ctx.getContent().substring(0, Math.min(ctx.getContent().length(), 80)) : ""));
            }
        }

        if (request.getExistingKeyOperations() != null) {
            keyOps.addAll(0, request.getExistingKeyOperations());
        }

        CompactResult result = new CompactResult();
        result.setSummary(summary.toString());
        result.setKeyOperations(keyOps);
        return result;
    }
}
