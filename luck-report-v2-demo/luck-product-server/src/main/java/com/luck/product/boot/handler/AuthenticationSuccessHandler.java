package com.luck.product.boot.handler;

import com.luck.product.boot.domain.vo.ResultVO;
import com.luck.product.boot.utils.ServletUtils;
import com.luck.product.boot.domain.dto.LoginUser;
import com.luck.product.boot.service.RemoteUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 认证成功处理
 * @author luck
 * @date 2021/3/11 15:00
 */
@Component
public class AuthenticationSuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationSuccessHandler.class);

    @Autowired
    private RemoteUserService remoteUserService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        LoginUser loginUser = (LoginUser) authentication.getPrincipal();
        String token = remoteUserService.createToken(loginUser);
        ResultVO resultVO = ResultVO.success(token);
        ServletUtils.writeResponseJson(response,resultVO);
        log.info("用户" + loginUser.getUsername() + "登录成功");
    }

}
