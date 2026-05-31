package com.luck.agent.service.impl;

import com.luck.agent.domain.entity.ChatMessage;
import com.luck.agent.mapper.ChatMessageMapper;
import com.luck.agent.service.ChatMessageService;
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
        chatMessageMapper.insert(message);
        log.info("保存消息: id={}, sessionId={}, role={}", message.getId(), message.getSessionId(), message.getRole());
        return message;
    }

    @Override
    public int batchSaveMessages(List<ChatMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return 0;
        }
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
