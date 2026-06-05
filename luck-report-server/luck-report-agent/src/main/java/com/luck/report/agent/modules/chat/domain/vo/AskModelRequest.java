package com.luck.report.agent.modules.chat.domain.vo;

import com.luck.report.agent.modules.modelConfig.domain.entity.ModelConfig;

import java.util.List;
import java.util.Map;

/**
 * 大模型调用请求参数
 * 封装调用大模型所需的全部参数，由调用方构建后传入 askModel
 *
 * 调用者：ChatController.chatStream() → ChatUtils.buildStreamCall()
 *         ChatCompactController.compact() → ChatUtils.askModel()
 *
 * @author luck
 */
public class AskModelRequest {
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

    /**
     * 构造函数
     *
     * @param chatConfig 模型配置，包含 baseUrl、apiKey、modelName 等，类型：ModelConfig，不可为空
     * @param messages OpenAI 格式的消息列表，类型：List<Map<String, Object>>，不可为空
     */
    public AskModelRequest(ModelConfig chatConfig, List<Map<String, Object>> messages) {
        this.chatConfig = chatConfig;
        this.messages = messages;
    }

    /**
     * 设置是否流式请求
     *
     * @param stream 是否流式，类型：boolean
     * @return 当前对象，支持链式调用
     */
    public AskModelRequest stream(boolean stream) {
        this.stream = stream;
        return this;
    }

    /**
     * 设置温度参数
     *
     * @param temperature 温度值，0~1，类型：Double，可为空
     * @return 当前对象，支持链式调用
     */
    public AskModelRequest temperature(Double temperature) {
        this.temperature = temperature;
        return this;
    }

    /**
     * 设置最大生成 token 数
     *
     * @param maxTokens 最大 token 数，类型：Integer，可为空
     * @return 当前对象，支持链式调用
     */
    public AskModelRequest maxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
        return this;
    }

    /**
     * 设置工具定义列表
     *
     * @param tools OpenAI Function Calling 格式的工具定义列表，类型：List<Map<String, Object>>，可为空
     * @return 当前对象，支持链式调用
     */
    public AskModelRequest tools(List<Map<String, Object>> tools) {
        this.tools = tools;
        return this;
    }

    /**
     * 设置工具调用策略
     *
     * @param toolChoice 工具调用策略，如 "auto"，类型：String，可为空
     * @return 当前对象，支持链式调用
     */
    public AskModelRequest toolChoice(String toolChoice) {
        this.toolChoice = toolChoice;
        return this;
    }

    /**
     * 设置流式选项
     *
     * @param streamOptions 流式选项，如 {"include_usage": true}，类型：Map<String, Object>，可为空
     * @return 当前对象，支持链式调用
     */
    public AskModelRequest streamOptions(Map<String, Object> streamOptions) {
        this.streamOptions = streamOptions;
        return this;
    }

    /**
     * 获取模型配置
     *
     * @return 模型配置，类型：ModelConfig
     */
    public ModelConfig getChatConfig() { return chatConfig; }

    /**
     * 获取消息列表
     *
     * @return OpenAI 格式的消息列表，类型：List<Map<String, Object>>
     */
    public List<Map<String, Object>> getMessages() { return messages; }

    /**
     * 是否流式请求
     *
     * @return 是否流式，类型：boolean
     */
    public boolean isStream() { return stream; }

    /**
     * 获取温度参数
     *
     * @return 温度值，类型：Double，可为空
     */
    public Double getTemperature() { return temperature; }

    /**
     * 获取最大生成 token 数
     *
     * @return 最大 token 数，类型：Integer，可为空
     */
    public Integer getMaxTokens() { return maxTokens; }

    /**
     * 获取工具定义列表
     *
     * @return OpenAI Function Calling 格式的工具定义列表，类型：List<Map<String, Object>>，可为空
     */
    public List<Map<String, Object>> getTools() { return tools; }

    /**
     * 获取工具调用策略
     *
     * @return 工具调用策略，类型：String，可为空
     */
    public String getToolChoice() { return toolChoice; }

    /**
     * 获取流式选项
     *
     * @return 流式选项，类型：Map<String, Object>，可为空
     */
    public Map<String, Object> getStreamOptions() { return streamOptions; }
}
