package com.luck.report.web.modules.chat.service;

import com.luck.report.web.modules.chat.domain.entity.ChatMessage;

import java.util.List;

/**
 * 聊天消息服务接口
 * 管理消息的保存、查询、批量保存等操作
 *
 * @author luck
 */
public interface ChatMessageService {

    /**
     * 根据会话ID查询消息列表
     * 按创建时间升序，保证消息顺序与对话顺序一致
     *
     * @param sessionId 会话ID，不可为空
     * @return 消息列表
     */
    List<ChatMessage> findBySessionId(String sessionId);

    /**
     * 保存单条消息
     *
     * @param message 消息实体，不可为空
     * @return 保存后的消息实体（含自增ID）
     */
    ChatMessage saveMessage(ChatMessage message);

    /**
     * 批量保存消息
     * Agentic Loop 结束后，前端一次性同步本轮新增的所有消息
     *
     * @param messages 消息列表，不可为空
     * @return 保存成功的消息数量
     */
    int batchSaveMessages(List<ChatMessage> messages);

    /**
     * 删除单条消息
     * 前端删除消息按钮调用，物理删除
     *
     * @param id 消息ID，不可为空
     */
    void deleteMessage(String id);
}
