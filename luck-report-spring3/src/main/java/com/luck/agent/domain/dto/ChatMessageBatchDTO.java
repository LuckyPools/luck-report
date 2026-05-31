package com.luck.agent.domain.dto;

import lombok.Data;

import java.util.List;

/**
 * 聊天消息批量保存请求 DTO
 * Agentic Loop 结束后，前端一次性同步本轮新增的所有消息
 * 包含 user → assistant(tool_calls) → tool_result → assistant 最终回复 的完整链路
 *
 * @author luck
 */
@Data
public class ChatMessageBatchDTO {

    /** 待保存的消息列表 */
    private List<ChatMessageDTO> messages;
}
