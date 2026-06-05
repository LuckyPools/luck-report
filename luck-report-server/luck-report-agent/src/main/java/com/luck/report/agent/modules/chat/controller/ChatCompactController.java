package com.luck.report.agent.modules.chat.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.agent.modules.modelConfig.domain.entity.ModelConfig;
import com.luck.report.agent.modules.chat.domain.vo.CompactRequest;
import com.luck.report.agent.modules.chat.domain.vo.CompactResult;
import com.luck.report.agent.modules.chat.domain.vo.ContextMessage;
import com.luck.report.agent.domain.vo.ResultVO;
import com.luck.report.agent.modules.modelConfig.service.ModelConfigDataService;
import com.luck.report.agent.modules.chat.domain.vo.AskModelRequest;
import com.luck.report.agent.modules.chat.domain.vo.AskModelResponse;
import com.luck.report.agent.modules.chat.utils.ChatUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

/**
 * 对话压缩控制器
 * 接收前端传入的早期对话消息，调用 LLM 生成结构化摘要，
 * 替代原始消息以减少上下文 token 消耗
 *
 * 工作流程：
 * 1. 前端检测到消息超过压缩阈值 → 收集早期消息
 * 2. 前端从 prompt/compact 加载压缩提示词，连同 messages + existingSummary + reportSnapshot 一起发送
 * 3. 后端使用前端传入的 compactPrompt 作为系统提示词，通过 ChatUtils.askModel() 调用 LLM 非流式生成摘要
 * 4. 返回 CompactResult（summary + keyOperations），前端替换早期消息
 *
 * @author luck
 */
@RestController
@RequestMapping("/chat")
public class ChatCompactController {

    private static final Logger log = LoggerFactory.getLogger(ChatCompactController.class);

    private final ModelConfigDataService modelConfigDataService;

    /**
     * 初始化对话压缩控制器
     *
     * @param modelConfigDataService 模型配置数据服务
     */
    public ChatCompactController(ModelConfigDataService modelConfigDataService) {
        this.modelConfigDataService = modelConfigDataService;
    }

    /**
     * 对话压缩接口（POST）
     * 接收早期对话消息，通过 ChatUtils.askModel() 调用 LLM 生成结构化摘要
     *
     * @param request 压缩请求，包含 messages、existingSummary、reportSnapshot、compactPrompt、modelId 等
     * @return ResultVO<CompactResult> 压缩结果，包含 summary 和 keyOperations
     */
    @PostMapping(value = "/compact", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResultVO<CompactResult> compact(@RequestBody CompactRequest request) {
        if (request.getMessages() == null || request.getMessages().isEmpty()) {
            return ResultVO.error("压缩消息列表为空");
        }

        if (request.getCompactPrompt() == null || request.getCompactPrompt().isEmpty()) {
            return ResultVO.error("压缩提示词不能为空，请由前端传入 compactPrompt");
        }

        try {
            // 根据modelId获取模型配置，如果未传则使用默认激活的第一个对话模型
            ModelConfig chatConfig = modelConfigDataService.getChatConfig(request.getModelId());
            List<Map<String, Object>> messages = buildCompactMessages(request);

            AskModelRequest askRequest = new AskModelRequest(chatConfig, messages)
                    .stream(false)
                    .temperature(0.3)
                    .maxTokens(1024);

            AskModelResponse askResponse = ChatUtils.askModel(askRequest);

            if (!askResponse.isSuccess()) {
                log.error("压缩API调用失败: status={}", askResponse.getStatusCode());
                return ResultVO.error("压缩API调用失败: " + askResponse.getStatusCode());
            }

            CompactResult result = parseCompactResult(askResponse.getBody());

            if (result == null) {
                log.warn("压缩结果解析失败，使用规则压缩兜底");
                result = fallbackCompact(request);
            }

            log.info("对话压缩完成: summary长度={}, keyOperations数量={}",
                    result.getSummary() != null ? result.getSummary().length() : 0,
                    result.getKeyOperations() != null ? result.getKeyOperations().size() : 0);

            return ResultVO.success(result);
        } catch (Exception e) {
            log.error("对话压缩异常: {}", e.getMessage(), e);
            return ResultVO.error("对话压缩失败: " + e.getMessage());
        }
    }

    /**
     * 构建压缩请求的消息列表
     * 组装 system prompt + 用户消息，供 ChatUtils.askModel() 使用
     *
     * @param request 压缩请求
     * @return OpenAI 格式的消息列表
     */
    private List<Map<String, Object>> buildCompactMessages(CompactRequest request) {
        List<Map<String, Object>> messages = new ArrayList<>();

        // 系统提示词：由前端管理并传入
        Map<String, Object> systemMsg = new LinkedHashMap<>(2);
        systemMsg.put("role", "system");
        systemMsg.put("content", request.getCompactPrompt());
        messages.add(systemMsg);

        // 构建用户消息：已有摘要 + 报表快照 + 待压缩的对话历史
        StringBuilder userContent = new StringBuilder();

        if (request.getExistingSummary() != null && !request.getExistingSummary().isEmpty()) {
            userContent.append("[已有的对话摘要]\n").append(request.getExistingSummary()).append("\n\n");
        }

        if (request.getReportSnapshot() != null && !request.getReportSnapshot().isEmpty()) {
            userContent.append("[当前报表状态快照]\n").append(request.getReportSnapshot()).append("\n\n");
        }

        if (request.getExistingKeyOperations() != null && !request.getExistingKeyOperations().isEmpty()) {
            userContent.append("[已有的关键操作记录]\n");
            for (String op : request.getExistingKeyOperations()) {
                userContent.append("- ").append(op).append("\n");
            }
            userContent.append("\n");
        }

        userContent.append("[需要压缩的对话历史]\n");
        for (ContextMessage ctx : request.getMessages()) {
            String roleLabel;
            if ("user".equals(ctx.getRole())) {
                roleLabel = "用户";
            } else if ("assistant".equals(ctx.getRole())) {
                roleLabel = "助手";
            } else if ("tool_result".equals(ctx.getRole())) {
                roleLabel = "工具结果(" + (ctx.getToolName() != null ? ctx.getToolName() : "unknown") + ")";
            } else {
                roleLabel = ctx.getRole();
            }
            String content = ctx.getContent();
            // 工具结果过长时截断，避免压缩请求本身 token 过多
            if (content != null && content.length() > 500) {
                content = content.substring(0, 300) + "\n...[截断]...\n" + content.substring(content.length() - 100);
            }
            userContent.append(roleLabel).append(": ").append(content).append("\n");
        }

        userContent.append("\n请基于以上信息生成压缩后的摘要和关键操作列表。");

        Map<String, Object> userMsg = new LinkedHashMap<>(2);
        userMsg.put("role", "user");
        userMsg.put("content", userContent.toString());
        messages.add(userMsg);

        return messages;
    }

    /**
     * 解析 LLM 压缩结果
     * 从 OpenAI 格式的非流式响应中提取 JSON 摘要
     *
     * @param responseBody API 响应体
     * @return CompactResult 或 null（解析失败时）
     */
    @SuppressWarnings("unchecked")
    private CompactResult parseCompactResult(String responseBody) {
        try {
            Map<String, Object> response = ChatUtils.getObjectMapper().readValue(responseBody, Map.class);
            if (response == null) return null;

            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) return null;

            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            if (message == null) return null;

            String content = (String) message.get("content");
            if (content == null || content.isEmpty()) return null;

            // 尝试从 content 中提取 JSON（LLM 可能在 JSON 前后加 markdown 标记）
            String jsonStr = extractJson(content);
            if (jsonStr == null) return null;

            Map<String, Object> result = ChatUtils.getObjectMapper().readValue(jsonStr, Map.class);
            if (result == null) return null;

            CompactResult compactResult = new CompactResult();
            compactResult.setSummary((String) result.get("summary"));

            List<String> keyOps = new ArrayList<>();
            Object keyOpsObj = result.get("keyOperations");
            if (keyOpsObj instanceof List) {
                for (Object item : (List<?>) keyOpsObj) {
                    keyOps.add(String.valueOf(item));
                }
            }
            compactResult.setKeyOperations(keyOps);

            // 校验摘要不为空
            if (compactResult.getSummary() == null || compactResult.getSummary().isEmpty()) {
                return null;
            }

            return compactResult;
        } catch (Exception e) {
            log.warn("解析压缩结果异常: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从 LLM 输出中提取 JSON 字符串
     * LLM 可能返回 ```json ... ``` 包裹的内容，需要提取纯 JSON
     *
     * @param content LLM 输出内容
     * @return 提取的 JSON 字符串，提取失败返回 null
     */
    private String extractJson(String content) {
        // 尝试提取 ```json ... ``` 包裹的内容
        int jsonStart = content.indexOf("```json");
        if (jsonStart >= 0) {
            int jsonEnd = content.indexOf("```", jsonStart + 7);
            if (jsonEnd > jsonStart) {
                return content.substring(jsonStart + 7, jsonEnd).trim();
            }
        }

        // 尝试提取 ``` ... ``` 包裹的内容
        int codeStart = content.indexOf("```");
        if (codeStart >= 0) {
            int codeEnd = content.indexOf("```", codeStart + 3);
            if (codeEnd > codeStart) {
                String inner = content.substring(codeStart + 3, codeEnd).trim();
                // 跳过可能的语言标记行
                int braceStart = inner.indexOf('{');
                if (braceStart >= 0) {
                    return inner.substring(braceStart);
                }
            }
        }

        // 尝试直接找 JSON 对象
        int braceStart = content.indexOf('{');
        int braceEnd = content.lastIndexOf('}');
        if (braceStart >= 0 && braceEnd > braceStart) {
            return content.substring(braceStart, braceEnd + 1);
        }

        return null;
    }

    /**
     * 规则压缩兜底方案
     * 当 LLM 压缩失败时，使用简单的规则提取关键信息
     *
     * @param request 压缩请求
     * @return 规则压缩的结果
     */
    private CompactResult fallbackCompact(CompactRequest request) {
        StringBuilder summary = new StringBuilder();
        List<String> keyOps = new ArrayList<>();

        if (request.getExistingSummary() != null && !request.getExistingSummary().isEmpty()) {
            summary.append(request.getExistingSummary()).append("\n\n[后续摘要]\n");
        }

        for (ContextMessage ctx : request.getMessages()) {
            if ("user".equals(ctx.getRole()) && ctx.getContent() != null) {
                summary.append("用户: ").append(ctx.getContent(), 0, Math.min(ctx.getContent().length(), 100)).append("\n");
            } else if ("assistant".equals(ctx.getRole()) && ctx.getContent() != null && !ctx.getContent().isEmpty()) {
                summary.append("助手: ").append(ctx.getContent(), 0, Math.min(ctx.getContent().length(), 100)).append("\n");
            } else if ("tool_result".equals(ctx.getRole()) && ctx.getToolName() != null) {
                keyOps.add(ctx.getToolName() + ": " + (ctx.getContent() != null ? ctx.getContent().substring(0, Math.min(ctx.getContent().length(), 80)) : ""));
            }
        }

        if (request.getExistingKeyOperations() != null) {
            keyOps.addAll(0, request.getExistingKeyOperations());
        }

        CompactResult result = new CompactResult();
        result.setSummary(summary.toString());
        result.setKeyOperations(keyOps);
        return result;
    }
}
