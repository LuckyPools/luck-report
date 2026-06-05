package com.luck.report.agent.modules.agentKnowledgeConfig.domain.enums;

import lombok.Getter;

/**
 * 知识类型枚举类
 * 用于标识智能体知识的类型
 *
 * @author luck
 */
@Getter
public enum KnowledgeType {

    /** 文档类型 */
    DOCUMENT("DOCUMENT"),

    /** 问答对类型 */
    QA("QA"),

    /** 常见问题类型 */
    FAQ("FAQ");

    private final String value;

    KnowledgeType(String value) {
        this.value = value;
    }

    /**
     * 根据字符串值获取对应的枚举实例
     *
     * @param value 字符串值
     * @return 对应的枚举实例
     * @throws IllegalArgumentException 如果值不匹配任何枚举
     */
    public static KnowledgeType fromValue(String value) {
        for (KnowledgeType type : KnowledgeType.values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown knowledge type: " + value);
    }
}
