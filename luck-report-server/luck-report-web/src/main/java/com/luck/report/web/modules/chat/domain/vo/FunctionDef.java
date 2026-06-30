package com.luck.report.web.modules.chat.domain.vo;

import lombok.Data;

import java.util.Map;

/**
 * 工具函数定义
 * 描述一个可供 LLM 调用的工具函数的名称、用途和参数格式
 *
 * @author luck
 */
@Data
public class FunctionDef {

    /** 函数名称 */
    private String name;

    /** 函数描述，供 LLM 理解调用时机 */
    private String description;

    /** 函数参数 JSON Schema（OpenAI standard 字段名 parameters，前端用 inputSchema 表达） */
    private Map<String, Object> parameters;

    /**
     * 函数返回结构 JSON Schema（可选）
     * 描述工具返回给 LLM 的数据结构与字段含义，让 LLM 调用前能预先理解返回值
     * 透传至 OpenAI tools[].function.outputSchema，主流 LLM（OpenAI/Qwen/DeepSeek）已支持
     */
    private Map<String, Object> outputSchema;
}
