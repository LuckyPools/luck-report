package com.luck.product.boot.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 *
 * @author luck
 */
@RestControllerAdvice
public class AuthExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(AuthExceptionHandler.class);

    /**
     * 验证码异常
     * ExceptionHandler只对进入mvc的请求生效
     */
//    @ExceptionHandler(CaptchaException.class)
//    public ResultVO handleCaptchaException(CaptchaException e, HttpServletRequest request)
//    {
//        String requestURI = request.getRequestURI();
//        log.error("请求地址'{}',验证码校验失败'{}'", requestURI, e.getMessage());
//        return ResultVO.error(e.getMessage());
//    }

}
