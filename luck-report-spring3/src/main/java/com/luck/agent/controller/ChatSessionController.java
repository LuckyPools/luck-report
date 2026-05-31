package com.luck.agent.controller;

import com.luck.agent.domain.entity.ChatSession;
import com.luck.agent.domain.vo.ResultVO;
import com.luck.agent.service.ChatSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 聊天会话控制器
 * 提供会话的创建、查询、重命名、置顶、删除等 REST 接口
 * 前端进入对话页面时通过此接口加载会话列表，进入旧对话时通过此接口获取会话信息
 *
 * @author luck
 */
@Slf4j
@RestController
@RequestMapping("/sessions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatSessionController {

    private final ChatSessionService chatSessionService;

    /**
     * 查询所有未删除的会话列表
     * 按置顶优先、更新时间倒序返回
     *
     * @return 会话列表
     */
    @GetMapping
    public ResultVO<List<ChatSession>> listSessions() {
        List<ChatSession> sessions = chatSessionService.findAll();
        return ResultVO.success("查询成功", sessions);
    }

    /**
     * 根据用户ID查询会话列表
     * 后续接入账号体系后，前端传 userId 获取对应用户的会话
     *
     * @param userId 用户ID
     * @return 会话列表
     */
    @GetMapping("/user/{userId}")
    public ResultVO<List<ChatSession>> getSessionsByUser(@PathVariable Long userId) {
        List<ChatSession> sessions = chatSessionService.findByUserId(userId);
        return ResultVO.success("查询成功", sessions);
    }

    /**
     * 根据会话ID查询会话详情
     *
     * @param sessionId 会话ID
     * @return 会话详情
     */
    @GetMapping("/{sessionId}")
    public ResultVO<ChatSession> getSession(@PathVariable String sessionId) {
        ChatSession session = chatSessionService.findBySessionId(sessionId);
        if (session == null) {
            return ResultVO.error("会话不存在");
        }
        return ResultVO.success("查询成功", session);
    }

    /**
     * 创建新会话
     * 前端首次发送消息时调用，返回包含 UUID 的会话对象
     *
     * @param request 请求体，可选字段：title-标题，userId-用户ID
     * @return 新建的会话实体
     */
    @PostMapping
    public ResultVO<ChatSession> createSession(@RequestBody(required = false) Map<String, Object> request) {
        String title = request != null ? (String) request.get("title") : null;
        Long userId = request != null ? toLong(request.get("userId")) : null;

        ChatSession session = chatSessionService.createSession(title, userId);
        return ResultVO.success("创建成功", session);
    }

    /**
     * 重命名会话
     *
     * @param sessionId 会话ID
     * @param request   请求体，包含 title 字段
     * @return 操作结果
     */
    @PutMapping("/{sessionId}/rename")
    public ResultVO<Void> renameSession(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> request) {
        String title = request.get("title");
        if (!StringUtils.hasText(title)) {
            return ResultVO.error("标题不能为空");
        }
        chatSessionService.renameSession(sessionId, title.trim());
        return ResultVO.success("重命名成功", null);
    }

    /**
     * 置顶或取消置顶会话
     *
     * @param sessionId 会话ID
     * @param request   请求体，包含 isPinned 字段（0-否，1-是）
     * @return 操作结果
     */
    @PutMapping("/{sessionId}/pin")
    public ResultVO<Void> pinSession(
            @PathVariable String sessionId,
            @RequestBody Map<String, Integer> request) {
        Integer isPinned = request.get("isPinned");
        if (isPinned == null) {
            return ResultVO.error("isPinned 不能为空");
        }
        chatSessionService.pinSession(sessionId, isPinned);
        return ResultVO.success(isPinned == 1 ? "已置顶" : "已取消置顶", null);
    }

    /**
     * 删除单个会话（软删除）
     *
     * @param sessionId 会话ID
     * @return 操作结果
     */
    @DeleteMapping("/{sessionId}")
    public ResultVO<Void> deleteSession(@PathVariable String sessionId) {
        chatSessionService.deleteSession(sessionId);
        return ResultVO.success("删除成功", null);
    }

    /**
     * 删除指定用户下的所有会话（软删除）
     *
     * @param userId 用户ID
     * @return 操作结果
     */
    @DeleteMapping("/user/{userId}")
    public ResultVO<Void> deleteSessionsByUser(@PathVariable Long userId) {
        chatSessionService.deleteSessionsByUserId(userId);
        return ResultVO.success("已清空所有会话", null);
    }

    /**
     * 安全地将 Object 转为 Long
     * 前端 JSON 中的数字可能被解析为 Long 或 Integer，统一处理
     *
     * @param value 原始值
     * @return Long 或 null
     */
    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
