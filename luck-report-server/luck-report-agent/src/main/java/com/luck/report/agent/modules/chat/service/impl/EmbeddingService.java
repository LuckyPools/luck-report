package com.luck.report.agent.modules.chat.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.agent.modules.modelConfig.domain.dto.ModelConfigDTO;
import com.luck.report.agent.modules.modelConfig.domain.entity.ModelConfig;
import com.luck.report.agent.modules.modelConfig.domain.enums.ModelType;
import com.luck.report.agent.modules.modelConfig.converter.ModelConfigConverter;
import com.luck.report.agent.modules.modelConfig.service.ModelConfigDataService;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Embedding 服务
 * 通过 OkHttp 调用阿里百炼 text-embedding-v3 API，将文本转为向量
 * 百炼 Embedding API 兼容 OpenAI /v1/embeddings 接口格式
 *
 * 调用方式：POST {baseUrl}/embeddings
 * 请求体：{"model": "text-embedding-v3", "input": ["文本1", "文本2"]}
 * 响应体：{"data": [{"embedding": [0.1, 0.2, ...]}, ...]}
 *
 * @author luck
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private final ModelConfigDataService modelConfigDataService;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 初始化 Embedding 服务
     * 注入 ModelConfigDataService 获取嵌入模型配置，构建 OkHttp 客户端
     *
     * @param modelConfigDataService 模型配置数据服务
     */
    public EmbeddingService(ModelConfigDataService modelConfigDataService) {
        this.modelConfigDataService = modelConfigDataService;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    /**
     * 将单条文本转为向量（使用默认嵌入模型）
     *
     * @param text 输入文本，不能为空
     * @return float[] 向量数组，维度由模型决定
     */
    public float[] embed(String text) {
        return embed(text, null);
    }

    /**
     * 将单条文本转为向量（指定嵌入模型）
     *
     * @param text    输入文本，不能为空
     * @param modelId 嵌入模型配置ID，为null时使用默认激活的第一个嵌入模型
     * @return float[] 向量数组，维度由模型决定
     */
    public float[] embed(String text, Long modelId) {
        List<float[]> results = embedBatch(Collections.singletonList(text), modelId);
        return results.isEmpty() ? new float[0] : results.get(0);
    }

    /**
     * 批量将文本转为向量（使用默认嵌入模型）
     * 百炼 API 单次最多支持 20 条文本
     *
     * @param texts 输入文本列表，不能为空，单次最多 20 条
     * @return List<float[]> 向量列表，顺序与输入一致
     */
    public List<float[]> embedBatch(List<String> texts) {
        return embedBatch(texts, null);
    }

    /**
     * 批量将文本转为向量（指定嵌入模型）
     * 百炼 API 单次最多支持 20 条文本
     *
     * @param texts   输入文本列表，不能为空，单次最多 20 条
     * @param modelId 嵌入模型配置ID，为null时使用默认激活的第一个嵌入模型
     * @return List<float[]> 向量列表，顺序与输入一致
     */
    public List<float[]> embedBatch(List<String> texts, Long modelId) {
        if (texts == null || texts.isEmpty()) {
            return Collections.emptyList();
        }

        // 根据 modelId 获取嵌入模型配置，未指定时使用默认激活的第一个
        ModelConfig embeddingConfig = getEmbeddingConfig(modelId);
        String baseUrl = embeddingConfig.getBaseUrl();
        String apiKey = embeddingConfig.getApiKey();
        String modelName = embeddingConfig.getModelName();
        String embeddingsPath = embeddingConfig.getEmbeddingsPath() != null
                ? embeddingConfig.getEmbeddingsPath()
                : "/embeddings";

        // 构建请求体，兼容 OpenAI 格式
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", modelName);
        requestBody.put("input", texts);

        String jsonBody;
        try {
            jsonBody = objectMapper.writeValueAsString(requestBody);
        } catch (Exception e) {
            log.error("序列化请求体失败", e);
            throw new RuntimeException("序列化请求体失败", e);
        }
        log.debug("Embedding 请求体: {}", jsonBody);

        Request httpRequest = new Request.Builder()
                .url(baseUrl + embeddingsPath)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(jsonBody, MediaType.parse("application/json")))
                .build();

        try (Response response = httpClient.newCall(httpRequest).execute()) {
            if (!response.isSuccessful()) {
                String errorMsg = response.body() != null ? response.body().string() : "未知错误";
                log.error("Embedding API 调用失败: status={}, body={}", response.code(), errorMsg);
                throw new RuntimeException("Embedding API 调用失败: " + response.code());
            }

            String responseBody = response.body() != null ? response.body().string() : "";
            return parseEmbeddingResponse(responseBody);
        } catch (IOException e) {
            log.error("Embedding API 请求异常: {}", e.getMessage(), e);
            throw new RuntimeException("Embedding API 请求异常", e);
        }
    }

    /**
     * 获取嵌入模型配置（使用默认激活的第一个嵌入模型）
     *
     * @return Index 嵌入模型配置
     * @throws RuntimeException 当找不到可用的嵌入模型时抛出
     */
    private ModelConfig getEmbeddingConfig() {
        return getEmbeddingConfig(null);
    }

    /**
     * 获取嵌入模型配置
     * 指定 modelId 时按ID查找，未指定时使用默认激活的第一个嵌入模型
     *
     * @param modelId 嵌入模型配置ID，为null时使用默认激活的第一个
     * @return Index 嵌入模型配置
     * @throws RuntimeException 当找不到指定的嵌入模型或无可用嵌入模型时抛出
     */
    private ModelConfig getEmbeddingConfig(Long modelId) {
        // 指定了modelId，按ID查找
        if (modelId != null) {
            ModelConfig config = modelConfigDataService.findById(modelId.intValue());
            if (config == null) {
                throw new RuntimeException("指定的嵌入模型不存在, modelId: " + modelId);
            }
            if (config.getModelType() != ModelType.EMBEDDING) {
                throw new RuntimeException("指定的模型不是嵌入模型, modelId: " + modelId);
            }
            log.info("使用指定嵌入模型: id={}, modelName={}", config.getId(), config.getModelName());
            return config;
        }

        // 未指定modelId，使用默认激活的第一个嵌入模型
        List<ModelConfigDTO> activeConfigs = modelConfigDataService.listActiveConfigsByType(ModelType.EMBEDDING);
        if (activeConfigs == null || activeConfigs.isEmpty()) {
            throw new RuntimeException("无可用的嵌入模型配置，请先在模型配置页面启用嵌入模型");
        }

        ModelConfigDTO dto = activeConfigs.get(0);
        log.info("使用默认嵌入模型: id={}, modelName={}", dto.getId(), dto.getModelName());
        return ModelConfigConverter.toEntity(dto);
    }

    /**
     * 解析 Embedding API 响应
     * 响应格式：{"data": [{"embedding": [0.1, 0.2, ...], "index": 0}, ...]}
     *
     * @param responseBody API 响应 JSON 字符串
     * @return List<float[]> 按 index 排序的向量列表
     */
    @SuppressWarnings("unchecked")
    private List<float[]> parseEmbeddingResponse(String responseBody) {
        try {
            Map<String, Object> responseMap = objectMapper.readValue(responseBody, new TypeReference<Map<String, Object>>() {});

            List<Map<String, Object>> dataList = (List<Map<String, Object>>) responseMap.get("data");
            if (dataList == null || dataList.isEmpty()) {
                log.warn("Embedding API 返回空数据");
                return Collections.emptyList();
            }

            // 按 index 排序，确保顺序与输入一致
            dataList.sort(Comparator.comparingInt(d -> ((Number) d.get("index")).intValue()));

            List<float[]> result = new ArrayList<>();
            for (Map<String, Object> dataItem : dataList) {
                List<Double> embeddingList = (List<Double>) dataItem.get("embedding");
                float[] vector = new float[embeddingList.size()];
                for (int i = 0; i < embeddingList.size(); i++) {
                    vector[i] = embeddingList.get(i).floatValue();
                }
                result.add(vector);
            }

            log.debug("Embedding 成功，返回 {} 条向量，维度 {}", result.size(),
                    result.isEmpty() ? 0 : result.get(0).length);
            return result;
        } catch (Exception e) {
            log.error("解析Embedding响应失败: {}", e.getMessage(), e);
            throw new RuntimeException("解析Embedding响应失败", e);
        }
    }
}
