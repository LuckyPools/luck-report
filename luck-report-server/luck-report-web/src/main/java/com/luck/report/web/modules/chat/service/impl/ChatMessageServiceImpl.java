package com.luck.report.web.modules.chat.service.impl;

import com.luck.report.web.utils.SnowflakeIdGenerator;
import com.luck.report.web.modules.chat.domain.entity.ChatMessage;
import com.luck.report.web.modules.chat.mapper.ChatMessageMapper;
import com.luck.report.web.modules.chat.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 聊天消息服务实现
 * 管理消息的保存、查询、批量保存等操作
 *
 * @author luck
 */
@Slf4j
@Service("bean.chatMessageService")
@RequiredArgsConstructor
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageMapper chatMessageMapper;

    @Override
    public List<ChatMessage> findBySessionId(String sessionId) {
        return chatMessageMapper.selectBySessionId(sessionId);
    }

    @Override
    public ChatMessage saveMessage(ChatMessage message) {
        // 由 Java 端生成 Snowflake ID（不再依赖数据库自增）
        if (message.getId() == null || message.getId().isEmpty()) {
            message.setId(SnowflakeIdGenerator.generateId());
        }
        // Java侧赋值createTime，替代数据库NOW()函数，抹除数据库特性差异
        message.setCreateTime(java.time.LocalDateTime.now());
        chatMessageMapper.insert(message);
        log.info("保存消息: id={}, sessionId={}, role={}", message.getId(), message.getSessionId(), message.getRole());
        return message;
    }

    @Override
    public int batchSaveMessages(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return 0;
        }
        // 为没有 ID 的消息生成 Snowflake ID
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (ChatMessage m : messages) {
            if (m.getId() == null || m.getId().isEmpty()) {
                m.setId(SnowflakeIdGenerator.generateId());
            }
            m.setCreateTime(now);
        }
        int count = chatMessageMapper.batchInsert(messages);
        log.info("批量保存消息: count={}, sessionId={}", count, messages.get(0).getSessionId());
        return count;
    }

    @Override
    public void deleteMessage(String id) {
        chatMessageMapper.deleteById(id);
        log.info("删除消息: id={}", id);
    }
}
