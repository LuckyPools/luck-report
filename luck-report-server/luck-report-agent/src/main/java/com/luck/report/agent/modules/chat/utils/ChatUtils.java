package com.luck.report.agent.modules.chat.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.agent.modules.chat.domain.vo.AskModelRequest;
import com.luck.report.agent.modules.chat.domain.vo.AskModelResponse;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 大模型接口调用工具类
 * 封装 OkHttp 调用大模型 API 的公共逻辑，供 ChatController 和 ChatCompactController 复用
 * 统一管理 HTTP 客户端、请求构建、响应解析等通用操作
 *
 * 调用者：ChatController.chatStream() → ChatUtils.buildStreamCall()
 *         ChatCompactController.compact() → ChatUtils.askModel()
 *
 * @author luck
 */
public class ChatUtils {

    private static final Logger log = LoggerFactory.getLogger(ChatUtils.class);

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 共享的 OkHttp 客户端实例
     * 读超时 120 秒，适配流式场景；非流式场景由调用方自行控制超时
     */
    private static final OkHttpClient SHARED_CLIENT = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build();

    /**
     * 调用大模型 API（非流式）
     * 构建 OpenAI 格式的请求体，发送 POST 请求，返回完整响应
     * 适用于对话压缩等不需要流式输出的场景
     *
     * @param request 调用请求参数，包含 chatConfig、messages 等
     * @return AskModelResponse 响应结果，包含状态码和响应体
     * @throws IOException 网络请求异常
     */
    public static AskModelResponse askModel(AskModelRequest request) throws IOException {
        String requestBody = buildOpenAiRequestBody(request);

        Request httpRequest = new Request.Builder()
                .url(request.getChatConfig().getBaseUrl() + request.getChatConfig().getCompletionsPath())
                .addHeader("Authorization", "Bearer " + request.getChatConfig().getApiKey())
                .addHeader("Content-Type", "application/json")
                .post(okhttp3.RequestBody.create(requestBody, okhttp3.MediaType.parse("application/json")))
                .build();

        try (Response response = SHARED_CLIENT.newCall(httpRequest).execute()) {
            String responseBody = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                // log.error("大模型API调用失败: status={}, body={}", response.code(), responseBody);
                return new AskModelResponse(response.code(), responseBody, false);
            }
            return new AskModelResponse(response.code(), responseBody, true);
        }
    }

    /**
     * 构建流式请求的 OkHttp Call 对象
     * 供 ChatController 等流式场景使用，调用方自行处理异步回调
     * 自动设置 stream=true，支持 tools、stream_options 等参数
     *
     * @param request 调用请求参数
     * @return OkHttp Call 对象，可调用 enqueue() 进行异步请求
     */
    public static Call buildStreamCall(AskModelRequest request) {
        request.stream(true);
        String requestBody = buildOpenAiRequestBody(request);

        Request httpRequest = new Request.Builder()
                .url(request.getChatConfig().getBaseUrl() + request.getChatConfig().getCompletionsPath())
                .addHeader("Authorization", "Bearer " + request.getChatConfig().getApiKey())
                .addHeader("Content-Type", "application/json")
                .post(okhttp3.RequestBody.create(requestBody, okhttp3.MediaType.parse("application/json")))
                .build();

        return SHARED_CLIENT.newCall(httpRequest);
    }

    /**
     * 构建 OpenAI 格式的请求体 JSON
     * 将消息列表、模型参数、工具定义等组装为标准 OpenAI API 请求格式
     * 支持 Function Calling（tools + tool_choice）和流式选项（stream_options）
     *
     * @param request 调用请求参数
     * @return JSON 格式的请求体字符串
     */
    private static String buildOpenAiRequestBody(AskModelRequest request) {
        Map<String, Object> body = new LinkedHashMap<>(8);
        body.put("model", request.getChatConfig().getModelName());
        body.put("messages", request.getMessages());
        body.put("stream", request.isStream());

        // 温度参数：优先使用请求指定的值，否则使用模型配置中的默认值
        if (request.getTemperature() != null) {
            body.put("temperature", request.getTemperature());
        } else if (request.getChatConfig().getTemperature() != null) {
            body.put("temperature", request.getChatConfig().getTemperature());
        }

        // 最大 token 数：优先使用请求指定的值，否则使用模型配置中的默认值
        // 不同模型对 max_tokens 有不同上限（如 qwen-max 上限 8192），超出会报错，此处做上限保护
        Integer maxTokens = request.getMaxTokens() != null ? request.getMaxTokens() : request.getChatConfig().getMaxTokens();
        if (maxTokens != null) {
            int capped = Math.min(maxTokens, 8192);
            if (capped < maxTokens) {
                log.warn("[ChatUtils] max_tokens={} 超过上限8192，已自动截断为{}", maxTokens, capped);
            }
            body.put("max_tokens", capped);
        }

        // 工具定义（Function Calling）
        if (request.getTools() != null && !request.getTools().isEmpty()) {
            body.put("tools", request.getTools());
            if (request.getToolChoice() != null) {
                body.put("tool_choice", request.getToolChoice());
            }
        }

        log.info("[ChatUtils] 请求体工具数量: {}, toolChoice: {}",
                request.getTools() != null ? request.getTools().size() : 0,
                request.getToolChoice());

        // 流式选项
        if (request.getStreamOptions() != null) {
            body.put("stream_options", request.getStreamOptions());
        }

        // 深度思考配置
        // 启用后，大模型会先生成推理过程（reasoning_content），再生成最终回复
        // 适用于阿里百炼 Qwen 等支持 thinking 参数的模型
        if (Boolean.TRUE.equals(request.getDeepThink())) {
            // 构建 extra_body 配置，启用思考过程
            Map<String, Object> extraBody = new LinkedHashMap<>(1);
            Map<String, Object> thinking = new LinkedHashMap<>(2);
            thinking.put("type", "thinking");
            thinking.put("budget_tokens", 3000); // 思考 token 预算，可根据需要调整
            extraBody.put("thinking", thinking);
            body.put("extra_body", extraBody);
            log.info("[ChatUtils] 已启用深度思考模式");
        }

        try {
            String jsonBody = objectMapper.writeValueAsString(body);
            log.info("[ChatUtils] 实际发送给LLM的请求体: {}", jsonBody);
            return jsonBody;
        } catch (Exception e) {
            log.error("序列化请求体失败", e);
            throw new RuntimeException("序列化请求体失败", e);
        }
    }

    /**
     * 获取共享的 ObjectMapper 实例
     * 供 Controller 复用，避免重复创建
     *
     * @return ObjectMapper 实例
     */
    public static ObjectMapper getObjectMapper() {
        return objectMapper;
    }

    /**
     * 获取共享的 OkHttpClient 实例
     * 供 Controller 复用，统一连接池管理
     *
     * @return OkHttpClient 实例
     */
    public static OkHttpClient getHttpClient() {
        return SHARED_CLIENT;
    }
}
