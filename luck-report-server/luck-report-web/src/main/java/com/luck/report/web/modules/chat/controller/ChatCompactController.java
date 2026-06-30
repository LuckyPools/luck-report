package com.luck.report.web.modules.chat.controller;

import com.luck.report.web.modules.chat.domain.vo.CompactRequest;
import com.luck.report.web.modules.chat.domain.vo.CompactResult;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.web.modules.chat.service.ChatService;
import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 对话压缩控制器
 * 接收前端传入的早期对话消息，调用 LLM 生成结构化摘要，
 * 替代原始消息以减少上下文 token 消耗
 *
 * 工作流程：
 * 1. 前端检测到消息超过压缩阈值 → 收集早期消息
 * 2. 前端从 prompt/compact 加载压缩提示词，连同 messages + existingSummary + reportSnapshot 一起发送
 * 3. 后端委托 ChatService.compact() 调用 LLM 非流式生成摘要
 * 4. 返回 CompactResult（summary + keyOperations），前端替换早期消息
 *
 * @author luck
 */
@RestController("bean.chatCompactController")
@RequestMapping("${luck-report.servletPrefix:}/chat")
@AllArgsConstructor
public class ChatCompactController {

    private final ChatService chatService;

    /**
     * 对话压缩接口（POST）
     * 委托 ChatService 处理压缩逻辑
     *
     * @param request 压缩请求，包含 messages、existingSummary、reportSnapshot、compactPrompt、modelId 等
     * @return ResultVO<CompactResult> 压缩结果，包含 summary 和 keyOperations
     */
    @PostMapping(value = "/compact", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResultVO<CompactResult> compact(@RequestBody CompactRequest request) {
        return chatService.compact(request);
    }
}
