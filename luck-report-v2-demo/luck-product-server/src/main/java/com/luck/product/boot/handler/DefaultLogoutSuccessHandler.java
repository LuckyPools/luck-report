package com.luck.product.boot.handler;

import com.luck.product.boot.domain.vo.ResultVO;
import com.luck.product.boot.utils.ServletUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 登出成功处理器
 * @author luck
 */
@Component
public class DefaultLogoutSuccessHandler implements LogoutSuccessHandler {

    @Override
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        ResultVO resultVO = ResultVO.success("退出登录成功");
        ServletUtils.writeResponseJson(response,resultVO);
    }
}
