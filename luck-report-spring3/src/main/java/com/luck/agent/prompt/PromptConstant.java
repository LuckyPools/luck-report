package com.luck.agent.prompt;

import dev.langchain4j.model.input.PromptTemplate;

/**
 * 提示词常量类
 * 提供统一的提示词模板获取入口，动态加载 prompt 目录下的提示词文件
 *
 * @author luck
 */
public class PromptConstant {

    /**
     * 获取系统角色提示词模板
     * 定义 AI 助手的基本角色和行为规范
     *
     * @return 系统角色提示词模板
     */
    public static PromptTemplate getSystemPromptTemplate() {
        return new PromptTemplate(PromptLoader.loadPrompt("system-prompt"));
    }

    /**
     * 获取意图识别提示词模板
     * 用于判断用户输入是闲聊还是数据分析请求
     *
     * @return 意图识别提示词模板
     */
    public static PromptTemplate getIntentRecognitionPromptTemplate() {
        return new PromptTemplate(PromptLoader.loadPrompt("intent-recognition"));
    }

    /**
     * 获取报告生成提示词模板
     * 用于根据数据生成分析报告
     *
     * @return 报告生成提示词模板
     */
    public static PromptTemplate getReportGeneratorPromptTemplate() {
        return new PromptTemplate(PromptLoader.loadPrompt("report-generator"));
    }

    /**
     * 获取查询增强提示词模板
     * 用于优化和扩展用户的查询语句
     *
     * @return 查询增强提示词模板
     */
    public static PromptTemplate getQueryEnhancementPromptTemplate() {
        return new PromptTemplate(PromptLoader.loadPrompt("query-enhancement"));
    }

}
