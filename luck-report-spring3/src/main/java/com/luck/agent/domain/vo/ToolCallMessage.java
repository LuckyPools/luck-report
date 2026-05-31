package com.luck.agent.domain.vo;

import lombok.Data;

/**
 * 工具调用消息片段
 * 对应 OpenAI 响应中 tool_calls 数组的单个元素
 *
 * @author luck
 */
@Data
public class ToolCallMessage {

    /** 工具调用唯一 ID */
    private String id;

    /** 工具类型，固定为 "function" */
    private String type;

    /** 函数调用信息 */
    private FunctionCallMessage function;
}
