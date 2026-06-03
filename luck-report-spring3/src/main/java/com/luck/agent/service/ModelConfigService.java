package com.luck.agent.service;

import com.luck.agent.domain.enums.ModelType;
import com.luck.agent.domain.entity.ModelConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 大模型配置服务
 * 从内存缓存中提供模型配置，后期会提供管理界面维护
 * 默认内置千问对话模型和嵌入模型的配置
 *
 * 缓存结构：key = modelName（如 "qwen3.6-plus"），value = ModelConfig
 *
 * @author luck
 */
@Service
public class ModelConfigService {

    private static final Logger log = LoggerFactory.getLogger(ModelConfigService.class);

    /** 模型配置缓存，key=模型名称，value=配置 */
    private final Map<String, ModelConfig> configCache = new ConcurrentHashMap<>();

    /**
     * 初始化默认模型配置
     * 后期由管理界面维护后，此处改为从数据库加载
     */
    @PostConstruct
    public void init() {
        // 默认千问对话模型配置
        ModelConfig chatConfig = new ModelConfig();
        chatConfig.setId(1);
        chatConfig.setProvider("alibaba");
        chatConfig.setBaseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1");
        chatConfig.setApiKey("sk-391c6103719e4169933ebcd160280b12");
        chatConfig.setModelName("qwen3.5-plus");
        chatConfig.setTemperature(0.7);
        chatConfig.setIsActive(true);
        chatConfig.setMaxTokens(8192);
        chatConfig.setModelType(ModelType.CHAT);
        chatConfig.setCompletionsPath("/chat/completions");
        chatConfig.setEmbeddingsPath(null);
        configCache.put(chatConfig.getModelName(), chatConfig);

        // 默认千问嵌入模型配置
        ModelConfig embeddingConfig = new ModelConfig();
        embeddingConfig.setId(2);
        embeddingConfig.setProvider("alibaba");
        embeddingConfig.setBaseUrl("https://dashscope.aliyuncs.com/compatible-mode/v1");
        embeddingConfig.setApiKey("sk-391c6103719e4169933ebcd160280b12");
        embeddingConfig.setModelName("text-embedding-v3");
        embeddingConfig.setTemperature(null);
        embeddingConfig.setIsActive(true);
        embeddingConfig.setMaxTokens(null);
        embeddingConfig.setModelType(ModelType.EMBEDDING);
        embeddingConfig.setCompletionsPath(null);
        embeddingConfig.setEmbeddingsPath("/embeddings");
        configCache.put(embeddingConfig.getModelName(), embeddingConfig);

        log.info("模型配置初始化完成，已加载 {} 个模型配置", configCache.size());
    }

    /**
     * 根据模型名称获取大模型配置
     *
     * @param modelName 模型名称，如 "qwen3.6-plus"
     * @return ModelConfig 配置对象
     * @throws IllegalArgumentException 模型不存在时抛出
     */
    public ModelConfig getByModelName(String modelName) {
        Assert.hasText(modelName, "模型名称不能为空");
        ModelConfig config = configCache.get(modelName);
        if (config == null) {
            throw new IllegalArgumentException("未找到模型配置: " + modelName);
        }
        return config;
    }

    /**
     * 根据名称获取 Embedding 模型配置
     * 优先按名称精确匹配，找不到则返回第一个 EMBEDDING 类型的激活配置
     *
     * @param modelName 嵌入模型名称，如 "text-embedding-v3"
     * @return ModelConfig 嵌入模型配置
     * @throws IllegalStateException 无可用嵌入模型时抛出
     */
    public ModelConfig getEmbeddingConfig(String modelName) {
        // 精确匹配
        if (modelName != null && !modelName.isEmpty()) {
            ModelConfig config = configCache.get(modelName);
            if (config != null && ModelType.EMBEDDING.equals(config.getModelType())) {
                return config;
            }
        }

        // 兜底：返回第一个激活的 EMBEDDING 配置
        ModelConfig defaultEmbedding = configCache.values().stream()
                .filter(c -> ModelType.EMBEDDING.equals(c.getModelType()) && Boolean.TRUE.equals(c.getIsActive()))
                .findFirst()
                .orElse(null);

        if (defaultEmbedding == null) {
            throw new IllegalStateException("无可用嵌入模型配置");
        }
        return defaultEmbedding;
    }

    /**
     * 根据名称获取 Chat 模型配置
     * 优先按名称精确匹配，找不到则返回第一个 CHAT 类型的激活配置
     *
     * @param modelName 对话模型名称，如 "qwen3.6-plus"
     * @return ModelConfig 对话模型配置
     * @throws IllegalStateException 无可用对话模型时抛出
     */
    public ModelConfig getChatConfig(String modelName) {
        // 精确匹配
        if (modelName != null && !modelName.isEmpty()) {
            ModelConfig config = configCache.get(modelName);
            if (config != null && ModelType.CHAT.equals(config.getModelType())) {
                return config;
            }
        }

        // 兜底：返回第一个激活的 CHAT 配置
        ModelConfig defaultChat = configCache.values().stream()
                .filter(c -> ModelType.CHAT.equals(c.getModelType()) && Boolean.TRUE.equals(c.getIsActive()))
                .findFirst()
                .orElse(null);

        if (defaultChat == null) {
            throw new IllegalStateException("无可用对话模型配置");
        }
        return defaultChat;
    }

    /**
     * 添加或更新模型配置到缓存
     *
     * @param config 模型配置
     */
    public void saveConfig(ModelConfig config) {
        Assert.notNull(config, "模型配置不能为空");
        Assert.hasText(config.getModelName(), "模型名称不能为空");
        configCache.put(config.getModelName(), config);
        log.info("保存模型配置: modelName={}, modelType={}", config.getModelName(), config.getModelType());
    }

    /**
     * 从缓存中移除模型配置
     *
     * @param modelName 模型名称
     */
    public void removeConfig(String modelName) {
        Assert.hasText(modelName, "模型名称不能为空");
        configCache.remove(modelName);
        log.info("移除模型配置: modelName={}", modelName);
    }

    /**
     * 获取所有模型配置
     *
     * @return 模型配置列表
     */
    public List<ModelConfig> listAll() {
        return configCache.values().stream().collect(Collectors.toList());
    }
}
