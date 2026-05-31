package com.luck.agent.vo;

import lombok.Data;

/**
 * 函数调用消息
 * 对应 OpenAI tool_calls 中 function 字段的结构
 *
 * @author luck
 */
@Data
public class FunctionCallMessage {

    /** 函数名称 */
    private String name;

    /** 函数调用参数 JSON 字符串 */
    private String arguments;
}
