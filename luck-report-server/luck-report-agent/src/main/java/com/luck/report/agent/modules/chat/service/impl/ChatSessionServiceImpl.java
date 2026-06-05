package com.luck.report.agent.modules.chat.service.impl;

import com.luck.report.agent.domain.vo.PageResultVO;
import com.luck.report.agent.modules.chat.domain.entity.ChatSession;
import com.luck.report.agent.modules.chat.mapper.ChatSessionMapper;
import com.luck.report.agent.modules.chat.service.ChatSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 聊天会话服务实现
 * 管理会话的创建、查询、更新、删除等生命周期操作
 *
 * @author luck
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatSessionServiceImpl implements ChatSessionService {

    private final ChatSessionMapper chatSessionMapper;

    @Override
    public List<ChatSession> findAll() {
        return chatSessionMapper.selectAll();
    }

    @Override
    public List<ChatSession> findByUserId(Long userId) {
        return chatSessionMapper.selectByUserId(userId);
    }

    @Override
    public PageResultVO<ChatSession> findByUserIdWithPage(Long userId, int pageNum, int pageSize) {
        long total = chatSessionMapper.countByUserId(userId);
        int offset = (pageNum - 1) * pageSize;
        List<ChatSession> records = chatSessionMapper.selectByUserIdWithPage(userId, offset, pageSize);
        return new PageResultVO<>(records, total, pageNum, pageSize);
    }

    @Override
    public ChatSession findBySessionId(String sessionId) {
        return chatSessionMapper.selectBySessionId(sessionId);
    }

    @Override
    public ChatSession createSession(String title, Long userId) {
        LocalDateTime now = LocalDateTime.now();
        ChatSession session = new ChatSession();
        session.setId(UUID.randomUUID().toString());
        session.setTitle(title != null ? title : "新对话");
        session.setStatus("active");
        session.setIsPinned(0);
        session.setUserId(userId);
        session.setCreateTime(now);
        session.setUpdateTime(now);

        chatSessionMapper.insert(session);
        log.info("创建会话: sessionId={}", session.getId());
        return session;
    }

    @Override
    public void updateSessionTime(String sessionId) {
        chatSessionMapper.updateSessionTime(sessionId, LocalDateTime.now());
    }

    @Override
    public void pinSession(String sessionId, Integer isPinned) {
        chatSessionMapper.updatePinStatus(sessionId, isPinned, LocalDateTime.now());
        log.info("更新会话置顶状态: sessionId={}, isPinned={}", sessionId, isPinned);
    }

    @Override
    public void renameSession(String sessionId, String newTitle) {
        chatSessionMapper.updateTitle(sessionId, newTitle, LocalDateTime.now());
        log.info("重命名会话: sessionId={}, newTitle={}", sessionId, newTitle);
    }

    @Override
    public void deleteSession(String sessionId) {
        chatSessionMapper.softDeleteById(sessionId, LocalDateTime.now());
        log.info("删除会话: sessionId={}", sessionId);
    }

    @Override
    public void deleteSessionsByUserId(Long userId) {
        int count = chatSessionMapper.softDeleteByUserId(userId, LocalDateTime.now());
        log.info("删除用户下所有会话: userId={}, count={}", userId, count);
    }
}
