package com.luck.report.web.handler;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.web.security.TokenException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Token 相关异常统一转 401。
 * <p>注意：{@link com.luck.report.web.security.TokenInterceptor} 内部已直接写 401 响应，
 * 该 handler 主要兜底 TokenService 内部主动抛 {@link TokenException} 的场景。
 *
 * @author luck-report
 * @since 1.0.0
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TokenExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(TokenExceptionHandler.class);

    @ExceptionHandler(TokenException.class)
    public ResultVO<?> handle(TokenException e) {
        log.debug("[Token] 鉴权失败: {}", e.getMessage());
        return ResultVO.error(401, e.getMessage());
    }
}
