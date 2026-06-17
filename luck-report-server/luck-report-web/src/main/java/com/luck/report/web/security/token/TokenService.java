package com.luck.report.web.security.token;

import com.luck.report.web.security.TokenProperties;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;

/**
 * 报表访问 Token 服务 SPI。
 * <p>业务方可整体替换为自定义实现（如对接 OAuth2、调用外部 IAM、Redis 存储等），
 * 框架只依赖该接口的方法。
 * <p><b>所有方法的实现策略（生成算法、存储介质、续期宽限期、黑名单等）均由实现方决定，
 * 框架不规定具体策略。</b>
 * <p>Bean 名：{@code bean.tokenService}。
 *
 * @author luck-report
 * @since 1.0.0
 */
public interface TokenService {

    /**
     * 签发 token。
     *
     * @param subject    业务身份（用户/系统），非空
     * @param scope      权限范围 designer/preview/export，非空
     * @param reports    限定可访问的报表 ID 列表，可为空（空 = 不限）
     * @param tenantId   租户 ID，可为空
     * @param ttlSeconds 过期秒数，&gt; 0
     * @return token 字符串
     */
    String generateToken(String subject, String scope,
                         List<String> reports, String tenantId, long ttlSeconds);

    /**
     * 校验 token 并返回解析后的 claims。
     *
     * @param token 待校验 token
     * @return claims，校验失败返回 null
     */
    Map<String, Object> verifyToken(String token);

    /**
     * 主动吊销 token。
     *
     * @param jti token 的唯一 ID（生成时写入 claims）
     */
    void revokeToken(String jti);

    /**
     * 自省 token：返回解析后的 claims（不做 active 校验）。
     * <p>用于第三方业务方在管理端展示 token 信息。
     *
     * @param token 待解析 token
     * @return claims；解析失败返回 null
     */
    Map<String, Object> introspectToken(String token);

    /**
     * 续期 token：用旧 token 换新 token。
     * <p><b>策略由实现方决定：</b>
     * <ul>
     *   <li>宽限期模式：旧 token 在宽限期内可换新，过期后拒绝</li>
     *   <li>严格模式：旧 token 必须未过期</li>
     *   <li>续期时旧 token 是否立即加入黑名单，由实现方决定</li>
     * </ul>
     *
     * @param oldToken   旧 token
     * @param ttlSeconds 新 token 过期秒数
     * @return 新 token；续期失败返回 null
     */
    String renewToken(String oldToken, long ttlSeconds);

    /**
     * 从请求中解析 token。
     * <p>解析顺序：{@code allowQueryToken=true} 时先尝试 query 参数 {@code token} / {@code X-Access-Token}，
     * 再读 header {@code headerName}。
     *
     * @param request HTTP 请求
     * @param props   配置项
     * @return token；不存在返回 null
     */
    String resolveToken(HttpServletRequest request, TokenProperties props);
}
