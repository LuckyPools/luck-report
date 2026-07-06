package com.luck.report.web.modules.chat.mapper;

import com.luck.report.web.modules.chat.domain.entity.ChatSession;
import org.apache.ibatis.annotations.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 聊天会话 Mapper
 * 提供 luck_chat_session 表的 CRUD 操作
 * SQL 定义在 resources/mapper/{databaseId}/ChatSessionMapper.xml 中，支持多数据库方言
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
    List<ChatSession> selectAll();

    /**
     * 根据用户ID查询会话列表
     * 按置顶优先、更新时间倒序排列
     *
     * @param userId 用户ID（字符串形式）
     * @return 会话列表
     */
    List<ChatSession> selectByUserId(@Param("userId") String userId);

    /**
     * 根据用户ID分页查询会话列表
     * 分页由拦截器自动改写，SQL 中无需手写 LIMIT
     *
     * @param userId   用户ID（字符串形式）
     * @param offset   偏移量
     * @param pageSize 每页数量
     * @return 会话列表
     */
    List<ChatSession> selectByUserIdWithPage(@Param("userId") String userId,
                                              @Param("offset") int offset,
                                              @Param("pageSize") int pageSize);

    /**
     * 统计指定用户下未删除的会话总数
     *
     * @param userId 用户ID（字符串形式）
     * @return 会话总数
     */
    long countByUserId(@Param("userId") String userId);

    /**
     * 根据会话ID查询会话详情
     *
     * @param sessionId 会话ID
     * @return 会话实体，不存在返回 null
     */
    ChatSession selectBySessionId(@Param("sessionId") String sessionId);

    /**
     * 插入新会话
     *
     * @param session 会话实体
     * @return 影响行数
     */
    int insert(ChatSession session);

    /**
     * 更新会话最后活动时间
     *
     * @param sessionId  会话ID
     * @param updateTime 更新时间
     * @return 影响行数
     */
    int updateSessionTime(@Param("sessionId") String sessionId, @Param("updateTime") LocalDateTime updateTime);

    /**
     * 更新会话置顶状态
     *
     * @param sessionId  会话ID
     * @param isPinned   是否置顶：0-否，1-是
     * @param updateTime 更新时间
     * @return 影响行数
     */
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
    int softDeleteById(@Param("sessionId") String sessionId, @Param("updateTime") LocalDateTime updateTime);

    /**
     * 软删除指定用户下的所有会话
     *
     * @param userId     用户ID（字符串形式）
     * @param updateTime 更新时间
     * @return 影响行数
     */
    int softDeleteByUserId(@Param("userId") String userId, @Param("updateTime") LocalDateTime updateTime);
}
