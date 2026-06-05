package com.luck.report.agent.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * HTTP 状态码枚举
 * 定义接口返回的 code 字段取值
 *
 * @author luck
 */
@Getter
@AllArgsConstructor
public enum HttpCodeEnum {

    OK(0, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UN_KNOW_ERROR(500, "未知错误");

    /** 状态码 */
    private final int code;

    /** 描述信息 */
    private final String message;
}
