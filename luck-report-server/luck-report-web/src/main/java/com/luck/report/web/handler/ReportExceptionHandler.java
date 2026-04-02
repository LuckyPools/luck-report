package com.luck.report.web.handler;

import com.luck.report.web.utils.ResponseUtils;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器
 * 用于捕获并处理ureport相关的异常，确保异常信息能正确返回给前端
 * @author luck
 */
@ControllerAdvice("bean.reportExceptionHandler")
public class ReportExceptionHandler {

    /**
     * 处理ServletException异常
     *
     * @param ex       ServletException异常
     * @param response HttpServletResponse响应对象
     * @throws IOException IO异常
     */
    @ExceptionHandler(ServletException.class)
    @ResponseBody
    public void handleServletException(ServletException ex, HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        String errorMessage = getRootErrorMessage(ex);
        Map<String, Object> result = new HashMap<>();
        result.put("data", null);
        result.put("code", 500);
        result.put("msg", errorMessage);
        ResponseUtils.writeObjectToJson(response, result);
    }

    /**
     * 处理ServletException异常
     *
     * @param ex       ServletException异常
     * @param response HttpServletResponse响应对象
     * @throws IOException IO异常
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseBody
    public void handleRuntimeException(RuntimeException ex, HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        String errorMessage = getRootErrorMessage(ex);
        Map<String, Object> result = new HashMap<>();
        result.put("data", null);
        result.put("code", 500);
        result.put("msg", errorMessage);
        ResponseUtils.writeObjectToJson(response, result);
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
