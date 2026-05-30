package com.luck.agent.controller;

import lombok.Data;

import java.util.List;

/**
 * 聊天请求 DTO
 * 接收前端 POST JSON 请求体，包含消息内容、历史上下文、附件等
 *
 * @author luck
 */
@Data
public class ChatRequest {

    /**
     * 用户输入的消息内容
     */
    private String message;

    /**
     * 是否启用联网搜索
     */
    private Boolean searchEnabled = false;

    /**
     * 历史消息上下文列表
     * 前端根据 historyType/historyCount 过滤后传入
     */
    private List<ContextMessage> contextMessages;

    /**
     * 图片附件列表
     */
    private List<AttachmentPayload> attachments;

    /**
     * 上下文消息
     * 用于构建多轮对话历史
     */
    @Data
    public static class ContextMessage {
        /** 消息角色：user / assistant / system */
        private String role;
        /** 消息内容 */
        private String content;
    }

    /**
     * 消息附件
     */
    @Data
    public static class AttachmentPayload {
        /** MIME 类型 */
        private String mimeType;
        /** Base64 编码数据 */
        private String data;
    }
}
