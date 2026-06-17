package com.luck.product.boot.handler;

import com.luck.product.boot.domain.enums.AuthCodeEnum;
import com.luck.product.boot.domain.vo.ResultVO;
import com.luck.product.boot.utils.ServletUtils;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 未认证处理器
 * 替代webflux中的AuthenticationEntryPoint
 * 处理未登录或token过期的情况
 * @author luck
 */
@Component
public class AuthenticationEntryPointImpl implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        // 构建错误响应
        ResultVO resultVO = ResultVO.error(
                AuthCodeEnum.USER_UNAUTHORIZED.getCode(),
                AuthCodeEnum.USER_UNAUTHORIZED.getMessage()
        );
        
        // 设置响应状态码
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        // 写入响应
        ServletUtils.writeResponseJson(response, resultVO);
    }
}
