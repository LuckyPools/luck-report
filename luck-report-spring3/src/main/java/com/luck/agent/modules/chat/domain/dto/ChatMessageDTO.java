package com.luck.agent.modules.chat.domain.dto;

import lombok.Data;

/**
 * 聊天消息请求 DTO
 * 前端保存单条消息时使用的请求体
 *
 * @author luck
 */
@Data
public class ChatMessageDTO {

    /** 角色：user / assistant / system / tool_result */
    private String role;

    /** 消息内容 */
    private String content;

    /** 消息类型：text / tool_call / tool_result / error */
    private String messageType;

    /** 元数据 JSON 字符串，存储 tool_calls 数组或 tool_call_id 等扩展信息 */
    private String metadata;
}
