package com.luck.agent.modules.chat.domain.vo;

import lombok.Data;

/**
 * 消息附件
 * 支持图片等二进制内容的 Base64 编码传输
 *
 * @author luck
 */
@Data
public class AttachmentPayload {

    /** MIME 类型 */
    private String mimeType;

    /** Base64 编码数据 */
    private String data;
}
