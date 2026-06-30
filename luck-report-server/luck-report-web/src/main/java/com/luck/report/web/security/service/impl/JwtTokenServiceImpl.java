package com.luck.report.web.security.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.web.modules.role.domain.dto.RoleInfo;
import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.service.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 框架自带的 TokenService 参考实现：JWT (HS256) + 进程内黑名单。
 * <p>纯 JDK 实现 JWT HS256 + Jackson 做 JSON 序列化；
 * 黑名单用 {@link ConcurrentHashMap}，适合单体应用或小规模集群；
 * 多节点部署时业务方可整体替换本类（如改用 Redis 存黑名单）。
 * <p>Bean 名：{@code bean.tokenService}。
 * <p><b>第三方业务方可以通过提供自定义实现并标记 @Primary 来覆盖此默认实现。
 * 注入点可以使用 @Qualifier("bean.tokenService") 来明确指定。</b>
 *
 * @author luck-report
 * @since 1.0.0
 */
@Component("bean.tokenService")
public class JwtTokenServiceImpl implements TokenService {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenServiceImpl.class);

    /** Jackson ObjectMapper（线程安全，可复用） */
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /** 弱密钥默认值，启动时会校验。 */
    public static final String DEFAULT_SECRET = "please-change-me";

    private final TokenProperties tokenProperties;

    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

    public JwtTokenServiceImpl(@Qualifier("bean.tokenProperties") TokenProperties tokenProperties) {
        this.tokenProperties = tokenProperties;
        // 启动时弱密钥直接启动失败
        if (DEFAULT_SECRET.equals(tokenProperties.getSecret())) {
            throw new IllegalStateException(
                    "[LuckReport-Token] secret 不能使用默认值 " + DEFAULT_SECRET
                            + "，请通过环境变量 LUCK_REPORT_TOKEN_SECRET 注入强密钥（>= 32 字符）");
        }
        if (tokenProperties.getSecret() == null || tokenProperties.getSecret().length() < 16) {
            throw new IllegalStateException(
                    "[LuckReport-Token] secret 长度至少 16 字符，当前长度=" +
                            (tokenProperties.getSecret() == null ? 0 : tokenProperties.getSecret().length()));
        }
    }

    /**
     * 获取当前请求用户的角色编码列表（模拟数据）。
     * <p>这是框架参考实现，返回模拟角色：["user", "test"]。
     * <p>第三方业务方替换实现时，应从 Session / Token claims / Header 等任意位置解析当前登录用户的角色。
     * <p>返回角色编码（如 ["ROLE_ADMIN","ROLE_FINANCE"]），与 luck_report_role.role_code 匹配。
     *
     * @param request HTTP 请求
     * @return 角色编码列表；解析失败或无角色返回空列表
     */
//    @Override
//    public List<String> getCurrentUserRoles(HttpServletRequest request) {
//        // 模拟数据：当前用户拥有 user、test 角色
//        return Arrays.asList("user", "test", "admin");
//    }

    /**
     * 获取第三方系统所有角色（模拟数据，用于"角色报表"管理页下拉/列表）。
     * <p>这是框架参考实现，返回模拟角色列表：[admin, user, test]。
     * <p>第三方业务方替换实现时，应调用第三方角色管理接口或查第三方角色表。
     *
     * @return 全量角色列表；获取失败返回空列表
     */
//    @Override
//    public List<RoleInfo> listAllRoles() {
//        // 模拟数据：全量角色列表
//        List<RoleInfo> roles = new ArrayList<>();
//        roles.add(new RoleInfo("admin", "管理员"));
//        roles.add(new RoleInfo("user", "普通用户"));
//        roles.add(new RoleInfo("test", "测试角色"));
//        return roles;
//    }

    // ==================== TokenService ====================

    /**
     * 签发 token。
     * <p>这是一个参考实现，框架默认提供，业务方可整体替换。
     * <p>从 request 中提取参数策略：
     * <ol>
     *   <li>subject：从 Session "userId" 或 Header "X-User-Id" 读取，默认 "anonymous"</li>
     *   <li>scope：从请求参数 "scope" 读取，默认 "preview"</li>
     *   <li>reports：从请求参数 "reports"（JSON 数组）读取</li>
     *   <li>tenantId：从请求参数 "tenantId" 读取</li>
     *   <li>ttlSeconds：从请求参数 "ttlSeconds" 读取，未指定时用配置默认值</li>
     * </ol>
     * <p><b>业务方替换实现时，可完全自定义参数提取逻辑，不受此限制。</b>
     */
    @Override
    public String generateToken(HttpServletRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("request 不能为空");
        }

        // 从 request 中提取参数（业务方替换实现时可完全自定义）
        String subject = extractSubject(request);
        String scope = request.getParameter("scope");
        if (scope == null || scope.isEmpty()) {
            scope = "preview"; // 默认 scope
        }

        String reportsStr = request.getParameter("reports");
        String tenantId = request.getParameter("tenantId");
        String ttlStr = request.getParameter("ttlSeconds");

        List<String> reports = null;
        if (reportsStr != null && !reportsStr.isEmpty()) {
            try {
                reports = objectMapper.readValue(reportsStr, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                log.debug("[Token] reports 参数解析失败: {}", e.getMessage());
            }
        }

        long ttlSeconds = tokenProperties.getTtlSeconds();
        if (ttlStr != null && !ttlStr.isEmpty()) {
            try {
                ttlSeconds = Long.parseLong(ttlStr);
            } catch (NumberFormatException e) {
                log.debug("[Token] ttlSeconds 参数解析失败: {}", e.getMessage());
            }
        }

        return generateTokenInternal(subject, scope, reports, tenantId, ttlSeconds);
    }

    /**
     * 从 request 中提取 subject（用户身份）。
     * <p>优先级：Session > Header > 默认值
     */
    private String extractSubject(HttpServletRequest request) {
        // 1. 从 Session 中读取（业务方可自定义）
        Object userObj = request.getSession().getAttribute("userId");
        if (userObj instanceof String) {
            return (String) userObj;
        }
        if (userObj != null) {
            return String.valueOf(userObj);
        }

        // 2. 从 Header 中读取
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader != null && !userIdHeader.isEmpty()) {
            return userIdHeader;
        }

        // 3. 默认值（dev 环境）
        return "anonymous";
    }

    /**
     * 内部签发 token 方法（参数已校验）。
     */
    private String generateTokenInternal(String subject, String scope,
                                         List<String> reports, String tenantId, long ttlSeconds) {
        if (subject == null || subject.isEmpty()) {
            throw new IllegalArgumentException("subject 不能为空");
        }
        if (scope == null || scope.isEmpty()) {
            throw new IllegalArgumentException("scope 不能为空");
        }
        if (ttlSeconds <= 0) {
            throw new IllegalArgumentException("ttlSeconds 必须 > 0");
        }

        long now = currentSeconds();
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", subject);
        claims.put("scope", scope);
        claims.put("reports", reports == null ? new ArrayList<>() : reports);
        if (tenantId != null && !tenantId.isEmpty()) {
            claims.put("tenant", tenantId);
        }
        claims.put("iat", now);
        claims.put("exp", now + ttlSeconds);
        claims.put("jti", UUID.randomUUID().toString().replace("-", ""));

        return sign(claims);
    }

    @Override
    public boolean verifyToken(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }
        try {
            Map<String, Object> claims = parseAndVerify(token);
            if (claims == null) {
                return false;
            }
            // 黑名单校验
            Object jtiObj = claims.get("jti");
            if (jtiObj instanceof String) {
                Long bannedUntil = blacklist.get(jtiObj);
                if (bannedUntil != null && bannedUntil > currentSeconds()) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            log.debug("[Token] verifyToken 失败: {}", e.getMessage());
            return false;
        }
    }

    // ==================== 内部：纯 JDK JWT HS256 ====================

    /**
     * 签发 JWT。
     */
    private String sign(Map<String, Object> claims) {
        try {
            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String payloadJson = objectMapper.writeValueAsString(claims);
            String headerB64 = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));
            String payloadB64 = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));
            String signingInput = headerB64 + "." + payloadB64;
            String signatureB64 = hmacSha256(signingInput, tokenProperties.getSecret());
            return signingInput + "." + signatureB64;
        } catch (Exception e) {
            throw new IllegalStateException("JWT 签发失败", e);
        }
    }

    /**
     * 解析 + 验签 JWT，返回 claims；验签失败返回 null。
     */
    private Map<String, Object> parseAndVerify(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        String signingInput = parts[0] + "." + parts[1];
        String expectedSig = hmacSha256(signingInput, tokenProperties.getSecret());
        // 常量时间比较，防时序攻击
        if (!constantTimeEquals(expectedSig, parts[2])) {
            return null;
        }
        byte[] payloadBytes;
        try {
            payloadBytes = base64UrlDecode(parts[1]);
        } catch (Exception e) {
            return null;
        }
        String payloadJson = new String(payloadBytes, StandardCharsets.UTF_8);
        Map<String, Object> claims;
        try {
            claims = objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.debug("[Token] JSON 解析失败: {}", e.getMessage());
            return null;
        }
        // 校验 exp（含 clock skew 容忍）
        long now = currentSeconds();
        long skew = tokenProperties.getClockSkewSeconds();
        Object expObj = claims.get("exp");
        if (expObj instanceof Number) {
            long exp = ((Number) expObj).longValue();
            if (exp + skew < now) {
                return null;
            }
        }
        return claims;
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return base64UrlEncode(sig);
        } catch (Exception e) {
            throw new IllegalStateException("HmacSHA256 不可用", e);
        }
    }

    private static String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static byte[] base64UrlDecode(String s) {
        return Base64.getUrlDecoder().decode(s);
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        byte[] ba = a.getBytes(StandardCharsets.UTF_8);
        byte[] bb = b.getBytes(StandardCharsets.UTF_8);
        if (ba.length != bb.length) {
            return false;
        }
        int diff = 0;
        for (int i = 0; i < ba.length; i++) {
            diff |= ba[i] ^ bb[i];
        }
        return diff == 0;
    }

    private static long currentSeconds() {
        return System.currentTimeMillis() / 1000L;
    }
}
