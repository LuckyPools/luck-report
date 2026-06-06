package com.luck.report.agent.modules.chat.controller;

import com.luck.report.agent.modules.chat.domain.dto.ChatMessageBatchDTO;
import com.luck.report.agent.modules.chat.domain.dto.ChatMessageDTO;
import com.luck.report.agent.modules.chat.domain.entity.ChatMessage;
import com.luck.report.agent.domain.vo.ResultVO;
import com.luck.report.agent.modules.chat.service.ChatMessageService;
import com.luck.report.agent.modules.chat.service.ChatSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 聊天消息控制器
 * 提供消息的查询、单条保存、批量保存等 REST 接口
 * URL 模式参照 data-agent-management：/sessions/{sessionId}/messages
 *
 * 消息存储流程（方案A：Loop 结束后批量存）：
 * 1. 用户发消息 → 前端 MemoryManager 追加到内存
 * 2. Agentic Loop 运行 → 全程前端内存管理
 * 3. Loop 结束 → 前端调用 POST /sessions/{sessionId}/messages/batch 批量保存
 * 4. 进入旧对话 → 前端调用 GET /sessions/{sessionId}/messages 加载历史
 *
 * @author luck
 */
@Slf4j
@RestController
@RequestMapping("${luck-report.servletPrefix:}/sessions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final ChatSessionService chatSessionService;

    /**
     * 根据会话ID查询消息列表
     * 前端进入旧对话时调用，从 DB 加载历史消息到前端 MemoryManager
     *
     * @param sessionId 会话ID
     * @return 消息列表，按创建时间升序
     */
    @GetMapping("/{sessionId}/messages")
    public ResultVO<List<ChatMessage>> getMessages(@PathVariable String sessionId) {
        List<ChatMessage> messages = chatMessageService.findBySessionId(sessionId);
        return ResultVO.success("查询成功", messages);
    }

    /**
     * 保存单条消息
     * 适用于非 Agent 场景或需要实时保存的场景
     *
     * @param sessionId 会话ID
     * @param dto       消息请求体
     * @return 保存后的消息实体
     */
    @PostMapping("/{sessionId}/messages")
    public ResultVO<ChatMessage> saveMessage(
            @PathVariable String sessionId,
            @RequestBody ChatMessageDTO dto) {
        if (dto == null || dto.getRole() == null) {
            return ResultVO.error("消息角色不能为空");
        }

        ChatMessage message = new ChatMessage();
        message.setSessionId(sessionId);
        message.setRole(dto.getRole());
        message.setContent(dto.getContent());
        message.setMessageType(dto.getMessageType() != null ? dto.getMessageType() : "text");
        message.setMetadata(dto.getMetadata());

        ChatMessage saved = chatMessageService.saveMessage(message);

        // 更新会话活动时间，用于会话列表排序
        chatSessionService.updateSessionTime(sessionId);

        return ResultVO.success("保存成功", saved);
    }

    /**
     * 批量保存消息
     * Agentic Loop 结束后，前端一次性同步本轮新增的所有消息
     * 包含完整的对话链路：user → assistant(tool_calls) → tool_result → assistant 最终回复
     *
     * @param sessionId 会话ID
     * @param batchDTO  批量消息请求体
     * @return 保存成功的消息数量
     */
    @PostMapping("/{sessionId}/messages/batch")
    public ResultVO<Integer> batchSaveMessages(
            @PathVariable String sessionId,
            @RequestBody ChatMessageBatchDTO batchDTO) {
        if (batchDTO == null || batchDTO.getMessages() == null || batchDTO.getMessages().isEmpty()) {
            return ResultVO.error("消息列表不能为空");
        }

        // DTO 转 Entity
        List<ChatMessage> messages = new ArrayList<>();
        for (ChatMessageDTO dto : batchDTO.getMessages()) {
            ChatMessage message = new ChatMessage();
            message.setSessionId(sessionId);
            message.setRole(dto.getRole());
            message.setContent(dto.getContent());
            message.setMessageType(dto.getMessageType() != null ? dto.getMessageType() : "text");
            message.setMetadata(dto.getMetadata());
            messages.add(message);
        }

        int count = chatMessageService.batchSaveMessages(messages);

        // 更新会话活动时间
        chatSessionService.updateSessionTime(sessionId);

        return ResultVO.success("批量保存成功", count);
    }

    /**
     * 删除单条消息
     * 前端删除消息按钮调用，物理删除
     *
     * @param id 消息ID
     * @return 操作结果
     */
    @DeleteMapping("/messages/item/{id}")
    public ResultVO<Void> deleteMessage(@PathVariable Long id) {
        chatMessageService.deleteMessage(id);
        return ResultVO.success("删除成功", null);
    }
}
