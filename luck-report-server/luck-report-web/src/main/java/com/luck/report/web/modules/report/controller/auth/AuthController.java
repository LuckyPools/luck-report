package com.luck.report.web.modules.report.controller.auth;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.web.exception.TokenException;
import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.service.TokenService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * 报表 Token 申请 controller。
 * <p>路径前缀：{@code ${luck-report.servletPrefix:report}/auth}。
 * <p><b>所有接口都走第三方业务系统自己的登录过滤器（{@code /auth/**} 在 TokenInterceptor 中已排除），
 * 业务方必须保证未登录用户无法调用。</b>
 * <p>Bean 名：{@code bean.authController}。
 *
 * @author luck-report
 * @since 1.0.0
 */
@RestController("bean.authController")
@RequestMapping("${luck-report.servletPrefix:}/auth")
public class AuthController {

    private final TokenService tokenService;
    private final TokenProperties props;

    public AuthController(TokenService tokenService, TokenProperties props) {
        this.tokenService = tokenService;
        this.props = props;
    }

    /**
     * 申请 token。
     * <p>直接传入 HttpServletRequest，由 TokenService 实现类决定如何生成 token。
     * <p>第三方系统可在 TokenService 实现中从 Session/Header/请求参数中提取所需信息。
     */
    @PostMapping("/getToken")
    public ResultVO<Map<String, Object>> getToken(HttpServletRequest request) {
        String token = tokenService.generateToken(request);
        if (token == null) {
            throw new TokenException("token 生成失败");
        }
        long ttl = props.getTtlSeconds();
        return ResultVO.success(buildTokenData(token, ttl));
    }

    private Map<String, Object> buildTokenData(String token, long ttl) {
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("expiresIn", ttl);
        data.put("tokenType", "Bearer");
        return data;
    }
}