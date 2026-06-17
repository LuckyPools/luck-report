package com.luck.report.web.controller.auth;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.web.domain.vo.ApplyRequest;
import com.luck.report.web.domain.vo.RenewRequest;
import com.luck.report.web.domain.vo.RevokeRequest;
import com.luck.report.web.security.TokenException;
import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.token.TokenService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 报表 Token 申请 / 续期 / 吊销 / 解析 controller。
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
     */
    @PostMapping("/getToken")
    public ResultVO<Map<String, Object>> getToken(@RequestBody ApplyRequest req) {
        if (req == null || req.subject == null || req.subject.isEmpty()) {
            throw new TokenException("subject 不能为空");
        }
        if (req.scope == null || req.scope.isEmpty()) {
            throw new TokenException("scope 不能为空");
        }
        long ttl = req.ttlSeconds > 0 ? req.ttlSeconds : props.getTtlSeconds();
        String token = tokenService.generateToken(
                req.subject, req.scope, req.reports, req.tenantId, ttl);
        return ResultVO.success(buildTokenData(token, ttl, req.scope));
    }

    /**
     * 续期 token。
     */
    @PostMapping("/renewToken")
    public ResultVO<Map<String, Object>> renewToken(@RequestBody RenewRequest req) {
        if (req == null || req.oldToken == null || req.oldToken.isEmpty()) {
            throw new TokenException("oldToken 不能为空");
        }
        long ttl = req.ttlSeconds > 0 ? req.ttlSeconds : props.getTtlSeconds();
        String newToken = tokenService.renewToken(req.oldToken, ttl);
        if (newToken == null) {
            throw new TokenException("续期失败：token 不存在、已过期且超过宽限期、或签名非法");
        }
        return ResultVO.success(buildTokenData(newToken, ttl, null));
    }

    /**
     * 吊销 token。
     */
    @PostMapping("/revokeToken")
    public ResultVO<Void> revokeToken(@RequestBody RevokeRequest req) {
        if (req == null || req.token == null || req.token.isEmpty()) {
            throw new TokenException("token 不能为空");
        }
        Map<String, Object> claims = tokenService.introspectToken(req.token);
        if (claims == null) {
            throw new TokenException("token 解析失败，无法吊销");
        }
        Object jti = claims.get("jti");
        if (jti instanceof String) {
            tokenService.revokeToken((String) jti);
        }
        return ResultVO.success();
    }


    private Map<String, Object> buildTokenData(String token, long ttl, String scope) {
        Map<String, Object> data = new HashMap<>();
        data.put("token", token);
        data.put("expiresIn", ttl);
        data.put("tokenType", "Bearer");
        if (scope != null) {
            data.put("scope", scope);
        }
        return data;
    }
}
