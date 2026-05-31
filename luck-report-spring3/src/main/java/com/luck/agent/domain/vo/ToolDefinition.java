package com.luck.agent.domain.vo;

import lombok.Data;

/**
 * 工具定义
 * 遵循 OpenAI Function Calling 协议的 tools 数组元素格式
 *
 * @author luck
 */
@Data
public class ToolDefinition {

    /** 工具类型，固定为 "function" */
    private String type = "function";

    /** 工具函数定义 */
    private FunctionDef function;
}
