package com.luck.report.agent.modules.modelConfig.domain.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 大模型配置DTO
 * 用于前后端交互,包含模型配置的所有字段
 *
 * @author luck
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelConfigDTO {

    /** 配置ID */
    private Integer id;

    /** 厂商标识(如 openai、deepseek、qwen) */
    @NotBlank(message = "提供商不能为空")
    private String provider;

    /** API密钥 */
    private String apiKey;

    /** API基础地址(如 https://api.openai.com) */
    @NotBlank(message = "baseUrl不能为空")
    private String baseUrl;

    /** 模型名称(如 gpt-4、deepseek-chat、qwen-plus) */
    @NotBlank(message = "模型名称不能为空")
    private String modelName;

    /** 自定义名称,最多50个字 */
    @Size(max = 50, message = "自定义名称不能超过50个字")
    private String configName;

    /** 排序字段,数字越小越靠前 */
    private Integer sort;

    /** 模型类型(CHAT/EMBEDDING) */
    @NotBlank(message = "模型类型不能为空")
    private String modelType;

    /** Chat Completions路径(如 /v1/chat/completions),仅当厂商路径非标准时填写 */
    private String completionsPath;

    /** Embeddings路径(如 /v1/embeddings),仅当厂商路径非标准时填写 */
    private String embeddingsPath;

    /** 温度参数,控制生成随机性,默认0.0 */
    private Double temperature = 0.0;

    /** 最大Token数,默认2000 */
    private Integer maxTokens = 2000;

    /** 是否激活:true-当前使用,false-未使用 */
    private Boolean isActive = true;

    /** 是否启用代理,默认关闭(使用直连) */
    private Boolean proxyEnabled = false;

    /** 代理主机地址 */
    private String proxyHost;

    /** 代理端口 */
    private Integer proxyPort;

    /** 代理用户名(可选) */
    private String proxyUsername;

    /** 代理密码(可选) */
    private String proxyPassword;
}
