package com.luck.agent.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 聊天会话实体
 * 对应 chat_session 表，管理用户与 Agent 的对话会话
 *
 * @author luck
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {

    /** 会话ID（UUID） */
    private String id;

    /** 会话标题 */
    private String title;

    /** 状态：active-活跃，archived-归档，deleted-已删除 */
    private String status;

    /** 是否置顶：0-否，1-是 */
    private Integer isPinned;

    /** 用户ID，预留字段，后续接入账号体系时使用 */
    private Long userId;

    /** 创建时间 */
    private LocalDateTime createTime;

    /** 更新时间 */
    private LocalDateTime updateTime;
}
