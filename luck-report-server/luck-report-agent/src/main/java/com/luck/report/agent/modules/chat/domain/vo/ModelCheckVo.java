package com.luck.report.agent.modules.chat.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 模型配置检查VO
 * 用于检查聊天模型和嵌入模型是否已配置且启用
 *
 * @author luck
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ModelCheckVo {

    /** 聊天模型是否就绪 */
    private boolean chatModelReady;

    /** 嵌入模型是否就绪 */
    private boolean embeddingModelReady;

    /** 整体是否就绪(聊天模型和嵌入模型都已配置) */
    private boolean ready;
}
