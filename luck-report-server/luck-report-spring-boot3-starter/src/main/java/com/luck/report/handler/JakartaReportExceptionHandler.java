package com.luck.report.handler;

import com.luck.report.utils.JakartaResponseUtils;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * 全局异常处理器
 * 用于捕获并处理ureport相关的异常，确保异常信息能正确返回给前端
 *
 * @author luck
 */
@ControllerAdvice("com.luck.report.web.controller")
public class JakartaReportExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(JakartaReportExceptionHandler.class);
    private static final Random random = new Random();

    /**
     * 处理 RuntimeException 及其子类异常
     * 仅处理报表模块抛出的异常，不会影响业务系统的异常处理
     *
     * @param ex       RuntimeException
     * @param response HttpServletResponse响应对象
     * @throws IOException IO异常
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseBody
    public void handleException(RuntimeException ex, HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        String errorMessage = getRootErrorMessage(ex);
        String auxCode = generateAuxCode();
        if (StringUtils.isBlank(errorMessage)) {
            errorMessage = "Unknown Error";
        }
        JakartaReportExceptionHandler.logger.error("Report Exception [auxCode={}]: {}", auxCode, errorMessage, ex);

        Map<String, Object> result = new HashMap<>();
        result.put("data", null);
        result.put("code", 500);
        result.put("msg", errorMessage);
        result.put("auxCode", auxCode);
        JakartaResponseUtils.writeObjectToJson(response, result);
    }

    /**
     * 生成10位辅助编码
     * 格式：时间戳后6位 + 4位随机数
     *
     * @return 10位辅助编码
     */
    private String generateAuxCode() {
        long timestamp = System.currentTimeMillis();
        String timestampPart = String.valueOf(timestamp % 1000000);
        while (timestampPart.length() < 6) {
            timestampPart = "0" + timestampPart;
        }
        int randomNum = JakartaReportExceptionHandler.random.nextInt(10000);
        String randomPart = String.format("%04d", randomNum);
        return timestampPart + randomPart;
    }

    /**
     * 获取根异常信息
     *
     * @param throwable 异常对象
     * @return 根异常的错误信息
     */
    private String getRootErrorMessage(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getMessage();
    }
}
