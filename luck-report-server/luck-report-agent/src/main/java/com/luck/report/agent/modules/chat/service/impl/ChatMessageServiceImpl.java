package com.luck.report.agent.modules.chat.service.impl;

import com.luck.report.agent.modules.chat.domain.entity.ChatMessage;
import com.luck.report.agent.modules.chat.mapper.ChatMessageMapper;
import com.luck.report.agent.modules.chat.service.ChatMessageService;
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
@Service
@RequiredArgsConstructor
public class ChatMessageServiceImpl implements ChatMessageService {

    private final ChatMessageMapper chatMessageMapper;

    @Override
    public List<ChatMessage> findBySessionId(String sessionId) {
        return chatMessageMapper.selectBySessionId(sessionId);
    }

    @Override
    public ChatMessage saveMessage(ChatMessage message) {
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
        // Java侧赋值createTime，替代数据库NOW()函数，抹除数据库特性差异
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        messages.forEach(m -> m.setCreateTime(now));
        int count = chatMessageMapper.batchInsert(messages);
        log.info("批量保存消息: count={}, sessionId={}", count, messages.get(0).getSessionId());
        return count;
    }

    @Override
    public void deleteMessage(Long id) {
        chatMessageMapper.deleteById(id);
        log.info("删除消息: id={}", id);
    }
}
