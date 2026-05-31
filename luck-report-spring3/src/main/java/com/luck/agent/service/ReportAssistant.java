package com.luck.agent.service;

import dev.langchain4j.service.TokenStream;

/**
 * 报表助手接口
 * 定义 AI 对话服务接口，支持流式响应和工具调用
 *
 * @author luck
 */
public interface ReportAssistant {

    /**
     * 分析并生成报表
     * 接收用户问题，通过工具调用完成报表生成任务
     *
     * @param userMessage 用户消息
     * @return 流式响应
     */
    TokenStream analyzeAndGenerateReport(String userMessage);

}
