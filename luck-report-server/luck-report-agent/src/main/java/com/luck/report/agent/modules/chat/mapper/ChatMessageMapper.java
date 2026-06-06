package com.luck.report.agent.modules.chat.mapper;

import com.luck.report.agent.modules.chat.domain.entity.ChatMessage;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 聊天消息 Mapper
 * 提供 luck_chat_message 表的 CRUD 操作，支持单条插入和批量插入
 * 使用 Spring Boot 默认主数据源
 * SQL 定义在 resources/mapper/{databaseId}/ChatMessageMapper.xml 中，支持多数据库方言
 *
 * @author luck
 */
@Mapper
public interface ChatMessageMapper {

    /**
     * 根据会话ID查询消息列表
     * 按创建时间升序排列，保证消息顺序与对话顺序一致
     *
     * @param sessionId 会话ID
     * @return 消息列表
     */
    List<ChatMessage> selectBySessionId(@Param("sessionId") String sessionId);

    /**
     * 根据ID查询消息
     *
     * @param id 消息ID
     * @return 消息实体
     */
    ChatMessage selectById(@Param("id") Long id);

    /**
     * 查询会话的消息数量
     *
     * @param sessionId 会话ID
     * @return 消息数量
     */
    int countBySessionId(@Param("sessionId") String sessionId);

    /**
     * 插入单条消息
     * createTime 由 Java 侧赋值，不依赖数据库函数
     *
     * @param message 消息实体
     * @return 影响行数
     */
    int insert(ChatMessage message);

    /**
     * 批量插入消息
     * Agentic Loop 结束后，前端一次性同步本轮新增的所有消息
     * createTime 由 Java 侧赋值，不依赖数据库函数
     *
     * @param messages 消息列表
     * @return 影响行数
     */
    int batchInsert(@Param("list") List<ChatMessage> messages);

    /**
     * 根据ID删除单条消息
     *
     * @param id 消息ID
     * @return 影响行数
     */
    int deleteById(@Param("id") Long id);

    /**
     * 根据会话ID删除所有消息
     * 物理删除，由 chat_session 的 ON DELETE CASCADE 级联触发
     *
     * @param sessionId 会话ID
     * @return 影响行数
     */
    int deleteBySessionId(@Param("sessionId") String sessionId);
}
