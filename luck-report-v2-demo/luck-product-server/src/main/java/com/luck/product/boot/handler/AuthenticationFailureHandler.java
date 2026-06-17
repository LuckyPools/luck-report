package com.luck.product.boot.handler;

import com.luck.product.boot.domain.enums.AuthCodeEnum;
import com.luck.product.boot.domain.vo.ResultVO;
import com.luck.product.boot.utils.ServletUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * 认证失败处理
 * @author luck
 * @date 2021/3/11 15:14
 */
@Component
public class AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        ResultVO<Object> resultVO;
        AuthCodeEnum authCodeEnum;
        if (exception instanceof UsernameNotFoundException) {
            // 账号不存在
            authCodeEnum = AuthCodeEnum.ACCOUNT_NOT_EXIST;
        } else if (exception instanceof BadCredentialsException) {
            // 用户名或密码错误
            authCodeEnum = AuthCodeEnum.LOGIN_PASSWORD_ERROR;
        } else if (exception instanceof AccountExpiredException) {
            // 账号已过期
            authCodeEnum = AuthCodeEnum.ACCOUNT_EXPIRED;
        } else if (exception instanceof LockedException) {
            // 账号已被锁定
            authCodeEnum = AuthCodeEnum.ACCOUNT_LOCKED;
        } else if (exception instanceof CredentialsExpiredException) {
            // 用户凭证已失效
            authCodeEnum = AuthCodeEnum.ACCOUNT_CREDENTIAL_EXPIRED;
        } else if (exception instanceof DisabledException) {
            // 账号已被禁用
            authCodeEnum = AuthCodeEnum.ACCOUNT_DISABLE;
        }  else{
            // 未知异常
            authCodeEnum = AuthCodeEnum.UNKNOWN_ERROR;
        }
        String msg = StringUtils.isNotBlank(exception.getMessage()) ? exception.getMessage() : authCodeEnum.getMessage();
        resultVO = ResultVO.error().setCode(HttpServletResponse.SC_INTERNAL_SERVER_ERROR).setMessage(msg);
        ServletUtils.writeResponseJson(response,resultVO);
    }


}
