package com.luck.product.boot.handler;

import com.luck.product.boot.domain.enums.AuthCodeEnum;
import com.luck.product.boot.domain.vo.ResultVO;
import com.luck.product.boot.utils.ServletUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 权限不足处理器
 * 替代webflux中的AccessDeniedHandler
 * @author luck
 */
@Component
public class AccessDeniedHandlerImpl implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException, ServletException {
        // 构建错误响应
        ResultVO resultVO = ResultVO.error(
                AuthCodeEnum.PERMISSION_DENIED.getCode(),
                AuthCodeEnum.PERMISSION_DENIED.getMessage()
        );
        
        // 写入响应
        ServletUtils.writeResponseJson(response, resultVO);
    }
}
