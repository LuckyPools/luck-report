package com.luck.agent.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.luck.agent.domain.entity.ModelConfig;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
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

    private static final Gson gson = new GsonBuilder().create();

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
     * 大模型调用请求参数
     * 封装调用大模型所需的全部参数，由调用方构建后传入 askModel
     */
    public static class AskModelRequest {
        /** 模型配置，包含 baseUrl、apiKey、modelName 等 */
        private final ModelConfig chatConfig;
        /** OpenAI 格式的消息列表 */
        private final List<Map<String, Object>> messages;
        /** 是否流式请求 */
        private boolean stream = false;
        /** 温度参数，控制生成随机性 */
        private Double temperature;
        /** 最大生成 token 数 */
        private Integer maxTokens;
        /** 工具定义列表（OpenAI Function Calling 格式），可为 null */
        private List<Map<String, Object>> tools;
        /** 工具调用策略，如 "auto"，可为 null */
        private String toolChoice;
        /** 流式选项，如 {"include_usage": true}，可为 null */
        private Map<String, Object> streamOptions;

        public AskModelRequest(ModelConfig chatConfig, List<Map<String, Object>> messages) {
            this.chatConfig = chatConfig;
            this.messages = messages;
        }

        /**
         * 设置是否流式请求
         *
         * @param stream 是否流式
         * @return 当前对象，支持链式调用
         */
        public AskModelRequest stream(boolean stream) {
            this.stream = stream;
            return this;
        }

        /**
         * 设置温度参数
         *
         * @param temperature 温度值，0~1
         * @return 当前对象，支持链式调用
         */
        public AskModelRequest temperature(Double temperature) {
            this.temperature = temperature;
            return this;
        }

        /**
         * 设置最大生成 token 数
         *
         * @param maxTokens 最大 token 数
         * @return 当前对象，支持链式调用
         */
        public AskModelRequest maxTokens(Integer maxTokens) {
            this.maxTokens = maxTokens;
            return this;
        }

        /**
         * 设置工具定义列表
         *
         * @param tools OpenAI Function Calling 格式的工具定义列表
         * @return 当前对象，支持链式调用
         */
        public AskModelRequest tools(List<Map<String, Object>> tools) {
            this.tools = tools;
            return this;
        }

        /**
         * 设置工具调用策略
         *
         * @param toolChoice 工具调用策略，如 "auto"
         * @return 当前对象，支持链式调用
         */
        public AskModelRequest toolChoice(String toolChoice) {
            this.toolChoice = toolChoice;
            return this;
        }

        /**
         * 设置流式选项
         *
         * @param streamOptions 流式选项，如 {"include_usage": true}
         * @return 当前对象，支持链式调用
         */
        public AskModelRequest streamOptions(Map<String, Object> streamOptions) {
            this.streamOptions = streamOptions;
            return this;
        }

        public ModelConfig getChatConfig() { return chatConfig; }
        public List<Map<String, Object>> getMessages() { return messages; }
        public boolean isStream() { return stream; }
        public Double getTemperature() { return temperature; }
        public Integer getMaxTokens() { return maxTokens; }
        public List<Map<String, Object>> getTools() { return tools; }
        public String getToolChoice() { return toolChoice; }
        public Map<String, Object> getStreamOptions() { return streamOptions; }
    }

    /**
     * 大模型调用响应结果
     * 封装非流式调用的响应数据，供调用方直接使用
     */
    public static class AskModelResponse {
        /** HTTP 状态码 */
        private final int statusCode;
        /** 响应体内容 */
        private final String body;
        /** 是否成功 */
        private final boolean success;

        public AskModelResponse(int statusCode, String body, boolean success) {
            this.statusCode = statusCode;
            this.body = body;
            this.success = success;
        }

        public int getStatusCode() { return statusCode; }
        public String getBody() { return body; }
        public boolean isSuccess() { return success; }
    }

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
                log.error("大模型API调用失败: status={}, body={}", response.code(), responseBody);
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
        if (request.getMaxTokens() != null) {
            body.put("max_tokens", request.getMaxTokens());
        } else if (request.getChatConfig().getMaxTokens() != null) {
            body.put("max_tokens", request.getChatConfig().getMaxTokens());
        }

        // 工具定义（Function Calling）
        if (request.getTools() != null && !request.getTools().isEmpty()) {
            body.put("tools", request.getTools());
            if (request.getToolChoice() != null) {
                body.put("tool_choice", request.getToolChoice());
            }
        }

        // 流式选项
        if (request.getStreamOptions() != null) {
            body.put("stream_options", request.getStreamOptions());
        }

        return gson.toJson(body);
    }

    /**
     * 获取共享的 Gson 实例
     * 供 Controller 复用，避免重复创建
     *
     * @return Gson 实例
     */
    public static Gson getGson() {
        return gson;
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
