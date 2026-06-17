package com.luck.report.web.security.token.impl;

import com.luck.report.web.security.TokenProperties;
import com.luck.report.web.security.token.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 框架自带的 TokenService 参考实现：JWT (HS256) + 进程内黑名单。
 * <p><b>不引入 jjwt 依赖</b>，纯 JDK 实现 JWT HS256；
 * 黑名单用 {@link ConcurrentHashMap}，适合单体应用或小规模集群；
 * 多节点部署时业务方可整体替换本类（如改用 Redis 存黑名单）。
 * <p>Bean 名：{@code bean.jwtTokenService}。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Component("bean.jwtTokenService")
public class JwtTokenService implements TokenService {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenService.class);

    /** 弱密钥默认值，启动时会校验。 */
    public static final String DEFAULT_SECRET = "please-change-me";

    /** 续期宽限期（秒）：旧 token 过期后 60s 内仍可换新。 */
    private static final long RENEW_GRACE_SECONDS = 60L;

    private final TokenProperties props;
    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

    public JwtTokenService(@Qualifier("bean.tokenProperties") TokenProperties props) {
        this.props = props;
        // 启动时弱密钥直接启动失败
        if (DEFAULT_SECRET.equals(props.getSecret())) {
            throw new IllegalStateException(
                    "[LuckReport-Token] secret 不能使用默认值 " + DEFAULT_SECRET
                            + "，请通过环境变量 LUCK_REPORT_TOKEN_SECRET 注入强密钥（>= 32 字符）");
        }
        if (props.getSecret() == null || props.getSecret().length() < 16) {
            throw new IllegalStateException(
                    "[LuckReport-Token] secret 长度至少 16 字符，当前长度=" +
                            (props.getSecret() == null ? 0 : props.getSecret().length()));
        }
    }

    // ==================== TokenService ====================

    @Override
    public String generateToken(String subject, String scope,
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
    public Map<String, Object> verifyToken(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }
        try {
            Map<String, Object> claims = parseAndVerify(token);
            if (claims == null) {
                return null;
            }
            // 黑名单校验
            Object jtiObj = claims.get("jti");
            if (jtiObj instanceof String) {
                Long bannedUntil = blacklist.get(jtiObj);
                if (bannedUntil != null && bannedUntil > currentSeconds()) {
                    return null;
                }
            }
            return claims;
        } catch (Exception e) {
            log.debug("[Token] verifyToken 失败: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public void revokeToken(String jti) {
        if (jti == null || jti.isEmpty()) {
            return;
        }
        // 写入黑名单，过期时间 = 当前 + 续期宽限期 + token 剩余 ttl 上限 = 24h
        blacklist.put(jti, currentSeconds() + 86400L);
        log.info("[Token] 吊销 jti={}", jti);
    }

    @Override
    public Map<String, Object> introspectToken(String token) {
        if (token == null || token.isEmpty()) {
            return null;
        }
        try {
            return parseAndVerify(token);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public String renewToken(String oldToken, long ttlSeconds) {
        if (oldToken == null || oldToken.isEmpty()) {
            return null;
        }
        // 1. 解析旧 token（不查黑名单，给宽限期机会）
        Map<String, Object> oldClaims = parseAndVerify(oldToken);
        if (oldClaims == null) {
            // 解析失败（签名错/格式错）
            return null;
        }
        // 2. 校验是否在宽限期内（未过期 or 过期在宽限期内）
        long now = currentSeconds();
        Object expObj = oldClaims.get("exp");
        long exp = (expObj instanceof Number) ? ((Number) expObj).longValue() : 0L;
        if (exp + RENEW_GRACE_SECONDS < now) {
            log.debug("[Token] 续期失败：已超过宽限期 exp={} now={}", exp, now);
            return null;
        }
        // 3. 用旧 claims 签发新 token
        Object jtiObj = oldClaims.get("jti");
        @SuppressWarnings("unchecked")
        List<String> reports = (List<String>) oldClaims.getOrDefault("reports", new ArrayList<>());
        String newToken = generateToken(
                String.valueOf(oldClaims.get("sub")),
                String.valueOf(oldClaims.get("scope")),
                reports,
                oldClaims.get("tenant") == null ? null : String.valueOf(oldClaims.get("tenant")),
                ttlSeconds > 0 ? ttlSeconds : props.getTtlSeconds()
        );
        // 4. 旧 token 立即吊销
        if (jtiObj instanceof String) {
            revokeToken((String) jtiObj);
        }
        log.info("[Token] 续期成功 sub={} scope={}", oldClaims.get("sub"), oldClaims.get("scope"));
        return newToken;
    }

    @Override
    public String resolveToken(HttpServletRequest request, TokenProperties props) {
        if (request == null) {
            return null;
        }
        // 1. query 参数（仅在 allowQueryToken=true 时）
        if (props != null && props.isAllowQueryToken()) {
            String t = request.getParameter("token");
            if (t == null || t.isEmpty()) {
                t = request.getParameter(props.getHeaderName());
            }
            if (t != null && !t.isEmpty()) {
                return t;
            }
        }
        // 2. header
        String header = props == null ? "X-Access-Token" : props.getHeaderName();
        String t = request.getHeader(header);
        return (t == null || t.isEmpty()) ? null : t;
    }

    // ==================== 内部：纯 JDK JWT HS256 ====================

    /**
     * 签发 JWT。
     */
    private String sign(Map<String, Object> claims) {
        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payloadJson = toJson(claims);
        String headerB64 = base64UrlEncode(headerJson.getBytes(StandardCharsets.UTF_8));
        String payloadB64 = base64UrlEncode(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = headerB64 + "." + payloadB64;
        String signatureB64 = hmacSha256(signingInput, props.getSecret());
        return signingInput + "." + signatureB64;
    }

    /**
     * 解析 + 验签 JWT，返回 claims；验签失败返回 null。
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseAndVerify(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        String signingInput = parts[0] + "." + parts[1];
        String expectedSig = hmacSha256(signingInput, props.getSecret());
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
        Map<String, Object> claims = parseJson(payloadJson);
        if (claims == null) {
            return null;
        }
        // 校验 exp（含 clock skew 容忍）
        long now = currentSeconds();
        long skew = props.getClockSkewSeconds();
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

    // ==================== 内部：极简 JSON 序列化（仅自描述 claims） ====================

    /**
     * 极简 JSON 序列化：只支持 String / Number / Boolean / null / List<String> / Map<String,Object>。
     * 不引入 jackson 在 TokenService 里的循环依赖。
     */
    @SuppressWarnings("unchecked")
    private String toJson(Object v) {
        if (v == null) {
            return "null";
        }
        if (v instanceof String) {
            return "\"" + escape((String) v) + "\"";
        }
        if (v instanceof Number || v instanceof Boolean) {
            return v.toString();
        }
        if (v instanceof List) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object o : (List<Object>) v) {
                if (!first) {
                    sb.append(",");
                }
                sb.append(toJson(o));
                first = false;
            }
            return sb.append("]").toString();
        }
        if (v instanceof Map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<String, Object> e : ((Map<String, Object>) v).entrySet()) {
                if (!first) {
                    sb.append(",");
                }
                sb.append("\"").append(escape(e.getKey())).append("\":").append(toJson(e.getValue()));
                first = false;
            }
            return sb.append("}").toString();
        }
        return "\"" + escape(v.toString()) + "\"";
    }

    private static String escape(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * 极简 JSON 解析：只支持本类 {@link #toJson(Object)} 输出的形态。
     */
    @SuppressWarnings("unchecked")
    private static Map<String, Object> parseJson(String json) {
        try {
            Object obj = new JsonParser(json).parseValue();
            if (obj instanceof Map) {
                return (Map<String, Object>) obj;
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 极简递归下降 JSON 解析器，仅支持对象 / 数组 / 字符串 / 数字 / true / false / null。
     */
    private static final class JsonParser {
        private final String s;
        private int pos;

        JsonParser(String s) {
            this.s = s;
            this.pos = 0;
        }

        Object parseValue() {
            skipWs();
            char c = peek();
            if (c == '{') {
                return parseObject();
            }
            if (c == '[') {
                return parseArray();
            }
            if (c == '"') {
                return parseString();
            }
            if (c == 't' || c == 'f') {
                return parseBool();
            }
            if (c == 'n') {
                parseLiteral("null");
                return null;
            }
            return parseNumber();
        }

        Map<String, Object> parseObject() {
            Map<String, Object> map = new HashMap<>();
            expect('{');
            skipWs();
            if (peek() == '}') {
                pos++;
                return map;
            }
            while (true) {
                skipWs();
                String key = parseString();
                skipWs();
                expect(':');
                Object value = parseValue();
                map.put(key, value);
                skipWs();
                char c = peek();
                if (c == ',') {
                    pos++;
                    continue;
                }
                if (c == '}') {
                    pos++;
                    return map;
                }
                throw new IllegalStateException("json 解析失败：对象位置 " + pos);
            }
        }

        List<Object> parseArray() {
            List<Object> list = new ArrayList<>();
            expect('[');
            skipWs();
            if (peek() == ']') {
                pos++;
                return list;
            }
            while (true) {
                Object value = parseValue();
                list.add(value);
                skipWs();
                char c = peek();
                if (c == ',') {
                    pos++;
                    continue;
                }
                if (c == ']') {
                    pos++;
                    return list;
                }
                throw new IllegalStateException("json 解析失败：数组位置 " + pos);
            }
        }

        String parseString() {
            expect('"');
            StringBuilder sb = new StringBuilder();
            while (pos < s.length()) {
                char c = s.charAt(pos++);
                if (c == '"') {
                    return sb.toString();
                }
                if (c == '\\' && pos < s.length()) {
                    char esc = s.charAt(pos++);
                    switch (esc) {
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case '/': sb.append('/'); break;
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        default: sb.append(esc);
                    }
                } else {
                    sb.append(c);
                }
            }
            throw new IllegalStateException("json 字符串未闭合");
        }

        Object parseBool() {
            if (s.startsWith("true", pos)) {
                pos += 4;
                return Boolean.TRUE;
            }
            if (s.startsWith("false", pos)) {
                pos += 5;
                return Boolean.FALSE;
            }
            throw new IllegalStateException("json 解析失败：bool 位置 " + pos);
        }

        Object parseNumber() {
            int start = pos;
            if (peek() == '-') {
                pos++;
            }
            boolean isFloat = false;
            while (pos < s.length()) {
                char c = s.charAt(pos);
                if (c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-') {
                    isFloat = true;
                    pos++;
                } else if (c >= '0' && c <= '9') {
                    pos++;
                } else {
                    break;
                }
            }
            String num = s.substring(start, pos);
            if (isFloat) {
                return Double.parseDouble(num);
            }
            try {
                return Long.parseLong(num);
            } catch (NumberFormatException e) {
                return Double.parseDouble(num);
            }
        }

        void parseLiteral(String lit) {
            if (!s.startsWith(lit, pos)) {
                throw new IllegalStateException("json 解析失败：literal " + lit);
            }
            pos += lit.length();
        }

        void expect(char c) {
            skipWs();
            if (pos >= s.length() || s.charAt(pos) != c) {
                throw new IllegalStateException("json 期望 '" + c + "' 位置 " + pos);
            }
            pos++;
        }

        void skipWs() {
            while (pos < s.length() && Character.isWhitespace(s.charAt(pos))) {
                pos++;
            }
        }

        char peek() {
            if (pos >= s.length()) {
                throw new IllegalStateException("json 越界 位置 " + pos);
            }
            return s.charAt(pos);
        }
    }
}
