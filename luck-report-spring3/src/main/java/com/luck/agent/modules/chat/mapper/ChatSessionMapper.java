package com.luck.agent.modules.chat.mapper;

import com.luck.agent.modules.chat.domain.entity.ChatSession;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 聊天会话 Mapper
 * 提供 chat_session 表的 CRUD 操作，使用注解方式定义 SQL
 * 使用 Spring Boot 默认主数据源
 *
 * @author luck
 */
@Mapper
public interface ChatSessionMapper {

    /**
     * 查询所有未删除的会话列表
     * 按置顶优先、更新时间倒序排列
     *
     * @return 会话列表
     */
    @Select("SELECT * FROM chat_session " +
            "WHERE status != 'deleted' " +
            "ORDER BY is_pinned DESC, update_time DESC")
    List<ChatSession> selectAll();

    /**
     * 根据用户ID查询会话列表
     * 按置顶优先、更新时间倒序排列
     *
     * @param userId 用户ID
     * @return 会话列表
     */
    @Select("SELECT * FROM chat_session " +
            "WHERE user_id = #{userId} AND status != 'deleted' " +
            "ORDER BY is_pinned DESC, update_time DESC")
    List<ChatSession> selectByUserId(@Param("userId") Long userId);

    /**
     * 根据用户ID分页查询会话列表
     * 按置顶优先、更新时间倒序排列
     *
     * @param userId 用户ID
     * @param offset 偏移量
     * @param limit  每页数量
     * @return 会话列表
     */
    @Select("SELECT * FROM chat_session " +
            "WHERE user_id = #{userId} AND status != 'deleted' " +
            "ORDER BY is_pinned DESC, update_time DESC " +
            "LIMIT #{offset}, #{limit}")
    List<ChatSession> selectByUserIdWithPage(@Param("userId") Long userId,
                                              @Param("offset") int offset,
                                              @Param("limit") int limit);

    /**
     * 统计指定用户下未删除的会话总数
     *
     * @param userId 用户ID
     * @return 会话总数
     */
    @Select("SELECT COUNT(*) FROM chat_session " +
            "WHERE user_id = #{userId} AND status != 'deleted'")
    long countByUserId(@Param("userId") Long userId);

    /**
     * 根据会话ID查询会话详情
     *
     * @param sessionId 会话ID
     * @return 会话实体，不存在返回 null
     */
    @Select("SELECT * FROM chat_session " +
            "WHERE id = #{sessionId} AND status != 'deleted'")
    ChatSession selectBySessionId(@Param("sessionId") String sessionId);

    /**
     * 插入新会话
     *
     * @param session 会话实体
     * @return 影响行数
     */
    @Insert("INSERT INTO chat_session (id, title, status, is_pinned, user_id, create_time, update_time) " +
            "VALUES (#{id}, #{title}, #{status}, #{isPinned}, #{userId}, #{createTime}, #{updateTime})")
    int insert(ChatSession session);

    /**
     * 更新会话最后活动时间
     *
     * @param sessionId  会话ID
     * @param updateTime 更新时间
     * @return 影响行数
     */
    @Update("UPDATE chat_session SET update_time = #{updateTime} WHERE id = #{sessionId}")
    int updateSessionTime(@Param("sessionId") String sessionId, @Param("updateTime") LocalDateTime updateTime);

    /**
     * 更新会话置顶状态
     *
     * @param sessionId  会话ID
     * @param isPinned   是否置顶：0-否，1-是
     * @param updateTime 更新时间
     * @return 影响行数
     */
    @Update("UPDATE chat_session SET is_pinned = #{isPinned}, update_time = #{updateTime} WHERE id = #{sessionId}")
    int updatePinStatus(@Param("sessionId") String sessionId, @Param("isPinned") Integer isPinned,
                        @Param("updateTime") LocalDateTime updateTime);

    /**
     * 重命名会话
     *
     * @param sessionId  会话ID
     * @param title      新标题
     * @param updateTime 更新时间
     * @return 影响行数
     */
    @Update("UPDATE chat_session SET title = #{title}, update_time = #{updateTime} WHERE id = #{sessionId}")
    int updateTitle(@Param("sessionId") String sessionId, @Param("title") String title,
                    @Param("updateTime") LocalDateTime updateTime);

    /**
     * 软删除单个会话
     * 将 status 设为 deleted 而非物理删除，保留数据可追溯
     *
     * @param sessionId  会话ID
     * @param updateTime 更新时间
     * @return 影响行数
     */
    @Update("UPDATE chat_session SET status = 'deleted', update_time = #{updateTime} WHERE id = #{sessionId}")
    int softDeleteById(@Param("sessionId") String sessionId, @Param("updateTime") LocalDateTime updateTime);

    /**
     * 软删除指定用户下的所有会话
     *
     * @param userId     用户ID
     * @param updateTime 更新时间
     * @return 影响行数
     */
    @Update("UPDATE chat_session SET status = 'deleted', update_time = #{updateTime} WHERE user_id = #{userId}")
    int softDeleteByUserId(@Param("userId") Long userId, @Param("updateTime") LocalDateTime updateTime);
}
