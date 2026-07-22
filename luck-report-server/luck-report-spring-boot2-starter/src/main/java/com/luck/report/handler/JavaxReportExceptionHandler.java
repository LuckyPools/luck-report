package com.luck.report.handler;

import com.luck.report.utils.JavaxResponseUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * 全局异常处理器（javax版本，用于Spring Boot2）
 * 仅处理报表相关的异常，不影响业务系统的异常处理规则
 * @author luck
 */
@ControllerAdvice("com.luck.report.web.controller")
public class JavaxReportExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(JavaxReportExceptionHandler.class);
    private static final Random random = new Random();

    @ExceptionHandler(RuntimeException.class)
    @ResponseBody
    public void handleException(RuntimeException ex, HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        String errorMessage = getRootErrorMessage(ex);
        String auxCode = generateAuxCode();
        if (StringUtils.isBlank(errorMessage)) {
            errorMessage = "Unknown Error";
        }
        logger.error("Report Exception [auxCode={}]: {}", auxCode, errorMessage, ex);

        Map<String, Object> result = new HashMap<>();
        result.put("data", null);
        result.put("code", 500);
        result.put("msg", errorMessage);
        result.put("auxCode", auxCode);
        JavaxResponseUtils.writeObjectToJson(response, result);
    }

    private String generateAuxCode() {
        long timestamp = System.currentTimeMillis();
        String timestampPart = String.valueOf(timestamp % 1000000);
        while (timestampPart.length() < 6) {
            timestampPart = "0" + timestampPart;
        }
        int randomNum = random.nextInt(10000);
        String randomPart = String.format("%04d", randomNum);
        return timestampPart + randomPart;
    }

    private String getRootErrorMessage(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return root.getMessage();
    }
}
