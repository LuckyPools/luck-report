package com.luck.report.web.modules.chat.domain.vo;

import lombok.Data;

import java.util.List;

/**
 * 对话压缩结果 DTO
 * LLM 生成的结构化摘要和关键操作记录，返回给前端替换早期消息
 *
 * @author luck
 */
@Data
public class CompactResult {

    /**
     * 新的摘要内容
     * LLM 基于旧摘要（如有）+ 早期消息生成的完整摘要
     */
    private String summary;

    /**
     * 更新后的关键操作列表
     * 包含历史操作 + 本轮新提取的操作记录
     */
    private List<String> keyOperations;
}
