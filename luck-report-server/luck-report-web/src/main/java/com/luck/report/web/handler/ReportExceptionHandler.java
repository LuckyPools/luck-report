package com.luck.report.web.handler;

import com.luck.report.common.domain.enums.HttpCodeEnum;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.web.exception.AuthException;
import com.luck.report.web.exception.TokenException;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.servlet.http.HttpServletResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * 全局异常处理器
 * 仅处理报表相关的异常，不影响业务系统的异常处理规则
 * @author luck
 */
@ControllerAdvice(basePackages = "com.luck.report")
public class ReportExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ReportExceptionHandler.class);
    private static final Random random = new Random();

    /**
     * 处理 RuntimeException 及其子类异常
     * 仅处理报表模块抛出的异常，不会影响业务系统的异常处理
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseBody
    public ResultVO<Object> handleException(RuntimeException ex) {
        String errorMessage = getRootErrorMessage(ex);
        String auxCode = generateAuxCode();
        if (StringUtils.isBlank(errorMessage)) {
            errorMessage = "Unknown Error";
        }
        logger.error("Report Exception [auxCode={}]: {}", auxCode, errorMessage, ex);

        Map<String, Object> data = new HashMap<>();
        data.put("auxCode", auxCode);
        return ResultVO.error(500, errorMessage).setData(data);
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
        int randomNum = random.nextInt(10000);
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
