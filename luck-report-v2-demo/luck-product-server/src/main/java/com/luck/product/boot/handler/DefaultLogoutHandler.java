package com.luck.product.boot.handler;

import com.luck.product.boot.service.RemoteUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 默认退出处理类
 * @author luck
 */
@Component
public class DefaultLogoutHandler implements LogoutHandler {

    @Autowired
    private RemoteUserService remoteUserService;

    @Override
    public void logout(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, Authentication authentication) {
        remoteUserService.logout();
    }
}
