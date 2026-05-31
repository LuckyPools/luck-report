package com.luck.agent.mapper;

import com.luck.agent.domain.entity.ChatMessage;
import org.apache.ibatis.annotations.*;

import java.util.List;

/**
 * 聊天消息 Mapper
 * 提供 chat_message 表的 CRUD 操作，支持单条插入和批量插入
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
    @Select("SELECT * FROM chat_message " +
            "WHERE session_id = #{sessionId} " +
            "ORDER BY create_time ASC")
    List<ChatMessage> selectBySessionId(@Param("sessionId") String sessionId);

    /**
     * 根据ID查询消息
     *
     * @param id 消息ID
     * @return 消息实体
     */
    @Select("SELECT * FROM chat_message WHERE id = #{id}")
    ChatMessage selectById(@Param("id") Long id);

    /**
     * 查询会话的消息数量
     *
     * @param sessionId 会话ID
     * @return 消息数量
     */
    @Select("SELECT COUNT(*) FROM chat_message WHERE session_id = #{sessionId}")
    int countBySessionId(@Param("sessionId") String sessionId);

    /**
     * 插入单条消息
     *
     * @param message 消息实体
     * @return 影响行数
     */
    @Insert("INSERT INTO chat_message (session_id, role, content, message_type, metadata, create_time) " +
            "VALUES (#{sessionId}, #{role}, #{content}, #{messageType}, #{metadata}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(ChatMessage message);

    /**
     * 批量插入消息
     * Agentic Loop 结束后，前端一次性同步本轮新增的所有消息
     * 使用 <foreach> 拼接 VALUES 子句，单条 SQL 完成批量插入
     *
     * @param messages 消息列表
     * @return 影响行数
     */
    @Insert("<script>" +
            "INSERT INTO chat_message (session_id, role, content, message_type, metadata, create_time) VALUES " +
            "<foreach collection='list' item='item' separator=','>" +
            "(#{item.sessionId}, #{item.role}, #{item.content}, #{item.messageType}, #{item.metadata}, NOW())" +
            "</foreach>" +
            "</script>")
    int batchInsert(@Param("list") List<ChatMessage> messages);

    /**
     * 根据ID删除单条消息
     *
     * @param id 消息ID
     * @return 影响行数
     */
    @Delete("DELETE FROM chat_message WHERE id = #{id}")
    int deleteById(@Param("id") Long id);

    /**
     * 根据会话ID删除所有消息
     * 物理删除，由 chat_session 的 ON DELETE CASCADE 级联触发
     *
     * @param sessionId 会话ID
     * @return 影响行数
     */
    @Delete("DELETE FROM chat_message WHERE session_id = #{sessionId}")
    int deleteBySessionId(@Param("sessionId") String sessionId);
}
