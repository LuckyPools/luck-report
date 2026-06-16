package com.luck.report.common.domain.vo;

import com.luck.report.common.domain.enums.HttpCodeEnum;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 返回结果VO对象
 * 所有 Controller 返回值统一使用此格式，便于前端解析
 * code=0 表示成功，非 0 表示失败
 *
 * @author luck
 */
@Data
@NoArgsConstructor
public class ResultVO<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    private int code = HttpCodeEnum.OK.getCode();

    private String message;

    private T data;

    public ResultVO(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public ResultVO(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    /**
     * 构建成功响应（无数据）
     *
     * @return ResultVO
     */
    public static <T> ResultVO<T> success() {
        return new ResultVO<>(HttpCodeEnum.OK.getCode(), HttpCodeEnum.OK.getMessage());
    }

    /**
     * 构建成功响应（含数据）
     *
     * @param data 响应数据
     * @return ResultVO
     */
    public static <T> ResultVO<T> success(T data) {
        return new ResultVO<>(HttpCodeEnum.OK.getCode(), HttpCodeEnum.OK.getMessage(), data);
    }

    /**
     * 构建成功响应（自定义消息 + 数据）
     *
     * @param message 成功消息
     * @param data    响应数据
     * @return ResultVO
     */
    public static <T> ResultVO<T> success(String message, T data) {
        return new ResultVO<>(HttpCodeEnum.OK.getCode(), message, data);
    }

    /**
     * 构建失败响应（默认错误码）
     *
     * @return ResultVO
     */
    public static <T> ResultVO<T> error() {
        return new ResultVO<>(HttpCodeEnum.UN_KNOW_ERROR.getCode(), HttpCodeEnum.UN_KNOW_ERROR.getMessage());
    }

    /**
     * 构建失败响应（含数据）
     *
     * @param data 错误数据
     * @return ResultVO
     */
    public static <T> ResultVO<T> error(T data) {
        return new ResultVO<>(HttpCodeEnum.UN_KNOW_ERROR.getCode(), HttpCodeEnum.UN_KNOW_ERROR.getMessage(), data);
    }

    /**
     * 构建失败响应（自定义错误码和消息）
     *
     * @param code    错误码
     * @param message 错误消息
     * @return ResultVO
     */
    public static <T> ResultVO<T> error(Integer code, String message) {
        return new ResultVO<>(code, message);
    }

    /**
     * 构建失败响应（自定义消息 + 数据）
     *
     * @param message 错误消息
     * @param data    错误数据
     * @return ResultVO
     */
    public static <T> ResultVO<T> error(String message, T data) {
        return new ResultVO<>(HttpCodeEnum.UN_KNOW_ERROR.getCode(), message, data);
    }

    /**
     * 仅用消息构建失败响应
     *
     * @param message 错误消息
     * @return ResultVO
     */
    public static <T> ResultVO<T> error(String message) {
        return new ResultVO<>(HttpCodeEnum.UN_KNOW_ERROR.getCode(), message);
    }

    public ResultVO<T> setCode(int code) {
        this.code = code;
        return this;
    }

    public ResultVO<T> setMessage(String message) {
        this.message = message;
        return this;
    }

    public ResultVO<T> setData(T data) {
        this.data = data;
        return this;
    }

    /**
     * 判断是否成功
     *
     * @return code == 0 时返回 true
     */
    public boolean isOk() {
        return this.code == HttpCodeEnum.OK.getCode();
    }
}
