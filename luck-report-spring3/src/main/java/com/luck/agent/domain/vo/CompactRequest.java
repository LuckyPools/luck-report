package com.luck.agent.domain.vo;

import lombok.Data;

import java.util.List;

/**
 * 对话压缩请求 DTO
 * 前端将需要压缩的历史消息发送给后端，由后端调用 LLM 生成结构化摘要
 *
 * @author luck
 */
@Data
public class CompactRequest {

    /**
     * 大模型配置ID
     * 用于指定使用哪个大模型进行对话压缩
     * 如果不传，则使用默认激活的第一个对话模型
     */
    private Integer modelId;

    /**
     * 需要压缩的历史消息列表
     * 通常是滑动窗口之外的早期消息
     */
    private List<ContextMessage> messages;

    /**
     * 已有的摘要内容（增量压缩时传入，LLM 基于旧摘要 + 新消息生成新摘要）
     * 首次压缩时为空
     */
    private String existingSummary;

    /**
     * 已有的关键操作记录（增量压缩时传入）
     */
    private List<String> existingKeyOperations;

    /**
     * 报表状态快照（压缩时注入，帮助 LLM 理解当前报表上下文）
     */
    private String reportSnapshot;

    /**
     * 压缩对话的系统提示词
     * 由前端管理并传入，后端不再硬编码提示词
     * 若前端未传入，后端使用内置默认提示词兜底
     */
    private String compactPrompt;
}
