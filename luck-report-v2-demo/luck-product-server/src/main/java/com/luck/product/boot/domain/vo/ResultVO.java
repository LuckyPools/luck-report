package com.luck.product.boot.domain.vo;

import com.luck.product.boot.domain.enums.HttpCodeEnum;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 返回结果VO对象
 *
 * @author luck
 * @date 2023-10-26
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

    public static <T> ResultVO<T> success(){
        return new ResultVO<T>(HttpCodeEnum.OK.getCode(), HttpCodeEnum.OK.getMessage());
    }

    public static <T> ResultVO<T> success(T data){
        return new ResultVO<T>(HttpCodeEnum.OK.getCode(), HttpCodeEnum.OK.getMessage(), data);
    }

    public static <T> ResultVO<T> success(String message,T data){
        return new ResultVO<T>(HttpCodeEnum.OK.getCode(), message, data);
    }

    public static <T> ResultVO<T> error(){
        return new ResultVO<T>(HttpCodeEnum.UN_KNOW_ERROR.getCode(), HttpCodeEnum.UN_KNOW_ERROR.getMessage());
    }

    public static <T> ResultVO<T> error(T data){
        return new ResultVO<T>(HttpCodeEnum.UN_KNOW_ERROR.getCode(), HttpCodeEnum.UN_KNOW_ERROR.getMessage(), data);
    }

    public static <T> ResultVO<T> error(Integer code, String message){
        return new ResultVO<T>(code, message);
    }

    public static <T> ResultVO<T> error(String message, T data){
        return new ResultVO<T>(HttpCodeEnum.UN_KNOW_ERROR.getCode(), message, data);
    }

    public ResultVO<T> setCode(int code){
        this.code = code;
        return this;
    }

    public ResultVO<T> setMessage(String message){
        this.message = message;
        return this;
    }

    public ResultVO<T> setData(T data){
        this.data = data;
        return this;
    }

    public boolean isOk(){
        return this.code == HttpCodeEnum.OK.getCode();
    }
}
