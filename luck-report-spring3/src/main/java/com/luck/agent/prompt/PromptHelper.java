package com.luck.agent.prompt;

import org.apache.commons.lang3.StringUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * 提示词辅助工具类
 * 提供提示词模板的参数填充和构建功能
 *
 * @author luck
 */
public class PromptHelper {

    /**
     * 构建系统提示词
     * 将角色信息注入到系统提示词模板中
     *
     * @param roleName    角色名称，可为空
     * @param description 角色描述，可为空
     * @return 渲染后的系统提示词
     */
    public static String buildSystemPrompt(String roleName, String description) {
        Map<String, Object> params = new HashMap<>();
        params.put("roleName", StringUtils.defaultString(roleName, "智能助手"));
        params.put("description", StringUtils.defaultString(description, "你是一个友好、专业的AI助手，能够帮助用户解答问题。"));
        return PromptConstant.getSystemPromptTemplate().apply(params).text();
    }

    /**
     * 构建意图识别提示词
     * 将用户问题注入到意图识别模板中
     *
     * @param question    用户问题，不可为空
     * @param chatHistory 对话历史，可为空
     * @return 渲染后的意图识别提示词
     */
    public static String buildIntentRecognitionPrompt(String question, String chatHistory) {
        Map<String, Object> params = new HashMap<>();
        params.put("question", question);
        params.put("chatHistory", StringUtils.defaultString(chatHistory, "无历史对话"));
        return PromptConstant.getIntentRecognitionPromptTemplate().apply(params).text();
    }

    /**
     * 构建报告生成提示词
     * 将数据和需求注入到报告生成模板中
     *
     * @param data     数据内容，可为空
     * @param requirement 报告需求描述，可为空
     * @return 渲染后的报告生成提示词
     */
    public static String buildReportGeneratorPrompt(String data, String requirement) {
        Map<String, Object> params = new HashMap<>();
        params.put("data", StringUtils.defaultString(data, "暂无数据"));
        params.put("requirement", StringUtils.defaultString(requirement, "请根据数据生成分析报告"));
        return PromptConstant.getReportGeneratorPromptTemplate().apply(params).text();
    }

    /**
     * 构建查询增强提示词
     * 将原始查询注入到增强模板中
     *
     * @param originalQuery 原始查询，不可为空
     * @return 渲染后的查询增强提示词
     */
    public static String buildQueryEnhancementPrompt(String originalQuery) {
        Map<String, Object> params = new HashMap<>();
        params.put("originalQuery", originalQuery);
        return PromptConstant.getQueryEnhancementPromptTemplate().apply(params).text();
    }

}
