package com.luck.agent.modules.modelConfig.domain.enums;

import lombok.Getter;

/**
 * 模型类型枚举
 * 区分对话模型和嵌入模型，用于 ModelConfig 的 modelType 字段
 *
 * @author luck
 */
@Getter
public enum ModelType {

    /** 对话模型（如 qwen3.6-plus） */
    CHAT("CHAT"),

    /** 嵌入模型（如 text-embedding-v3） */
    EMBEDDING("EMBEDDING");

    private final String code;

    ModelType(String code) {
        this.code = code;
    }

    /**
     * 根据代码获取枚举
     *
     * @param code 模型类型代码
     * @return 对应的 ModelType 枚举
     * @throws IllegalArgumentException 未知代码时抛出
     */
    public static ModelType fromCode(String code) {
        for (ModelType type : values()) {
            if (type.getCode().equals(code)) {
                return type;
            }
        }
        throw new IllegalArgumentException("未知的模型类型代码: " + code);
    }
}
