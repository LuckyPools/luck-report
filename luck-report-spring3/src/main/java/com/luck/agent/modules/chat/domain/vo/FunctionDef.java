package com.luck.agent.modules.chat.domain.vo;

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

    /** 函数参数 JSON Schema */
    private Map<String, Object> parameters;
}
