package com.luck.product.boot.report;

import com.luck.product.boot.domain.dto.LoginUser;
import com.luck.product.boot.utils.UserUtils;
import com.luck.report.web.modules.role.domain.dto.RoleInfo;
import com.luck.report.web.security.service.TokenService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 报表 TokenService 实现。
 * <p>生成 16 位随机 token，并存储在内存中以便验证。
 * <ul>
 *   <li>generateToken：生成 16 位 UUID 随机字符串</li>
 *   <li>verifyToken：检查 token 是否存在且未过期（默认有效期 24 小时）</li>
 *   <li>getCurrentUserRoles：从 SecurityContext 获取当前用户的角色</li>
 *   <li>listAllRoles：返回模拟的角色列表</li>
 * </ul>
 * <p><b>使用 @Primary 标记为优先实现，会覆盖报表项目的默认 JwtTokenServiceImpl。
 * 所有注入 TokenService 的地方（除非明确使用 @Qualifier）都会使用此实现。</b>
 *
 * @author luck-product
 * @since 1.0.0
 */
@Slf4j
@Service("bean.reportTokenService")
@Primary  // 标记为优先实现，覆盖报表项目的 JwtTokenServiceImpl
public class ReportTokenServiceImpl implements TokenService {

    /** token 存储映射：token -> 用户信息（包含用户名和过期时间） */
    private final Map<String, TokenInfo> tokenStore = new ConcurrentHashMap<>();

    /** token 有效期（毫秒）：默认 24 小时 */
    private static final long TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000L;

    /**
     * 签发 token。
     * <p>实现策略：
     * <ul>
     *   <li>从 SecurityContext 获取当前登录用户（LoginUser）</li>
     *   <li>生成 16 位随机字符串（使用 UUID 截取）</li>
     *   <li>将 token 和用户信息存储到 tokenStore</li>
     * </ul>
     *
     * @param request HTTP 请求
     * @return 16 位 token 字符串；生成失败返回 null
     */
    @Override
    public String generateToken(HttpServletRequest request) {
        try {
            // 1. 从 SecurityContext 获取当前登录用户
            LoginUser loginUser = UserUtils.getCurrentUser();
            if (loginUser == null) {
                log.warn("报表 Token 生成失败：当前用户未登录");
                return null;
            }

            // 2. 生成 16 位随机 token（使用 UUID 截取）
            String uuid = UUID.randomUUID().toString().replace("-", "");
            String token = uuid.substring(0, 16);

            // 3. 存储 token 和用户信息（包含过期时间）
            long expirationTime = System.currentTimeMillis() + TOKEN_EXPIRATION_MS;
            tokenStore.put(token, new TokenInfo(loginUser.getUsername(), expirationTime));

            log.info("报表 Token 生成成功：username={}, token={}, length={}", 
                    loginUser.getUsername(), token, token.length());
            return token;
        } catch (Exception e) {
            log.error("报表 Token 生成异常", e);
            return null;
        }
    }

    /**
     * 校验 token 是否有效。
     * <p>实现策略：
     * <ul>
     *   <li>检查 token 是否存在于 tokenStore</li>
     *   <li>检查 token 是否过期</li>
     *   <li>如果过期，从 tokenStore 中移除</li>
     * </ul>
     *
     * @param token 待校验 token
     * @return true 表示有效；false 表示无效或已过期
     */
    @Override
    public boolean verifyToken(String token) {
        try {
            // 1. 参数校验
            if (StringUtils.isEmpty(token)) {
                log.warn("报表 Token 校验失败：token 为空");
                return false;
            }

            // 2. 检查 token 是否存在
            TokenInfo tokenInfo = tokenStore.get(token);
            if (tokenInfo == null) {
                log.warn("报表 Token 校验失败：token 不存在, token={}", token);
                return false;
            }

            // 3. 检查 token 是否过期
            if (tokenInfo.expirationTime < System.currentTimeMillis()) {
                log.warn("报表 Token 校验失败：token 已过期, token={}, username={}", 
                        token, tokenInfo.username);
                tokenStore.remove(token);  // 移除过期的 token
                return false;
            }

            log.info("报表 Token 校验成功：token={}, username={}", token, tokenInfo.username);
            return true;
        } catch (Exception e) {
            log.error("报表 Token 校验异常：token={}", token, e);
            return false;
        }
    }

    /**
     * 获取当前请求用户的角色编码列表。
     * <p>实现策略：
     * <ul>
     *   <li>从 SecurityContext 获取当前登录用户（LoginUser）</li>
     *   <li>返回 LoginUser.roles 字段</li>
     * </ul>
     *
     * @param request HTTP 请求
     * @return 角色编码列表；解析失败或无角色返回空列表
     */
    @Override
    public List<String> getCurrentUserRoles(HttpServletRequest request) {
        LoginUser loginUser = UserUtils.getCurrentUser();
        if (loginUser == null) {
            return Collections.emptyList();
        }
        return loginUser.getRoles() == null ? Collections.emptyList() : loginUser.getRoles();
    }

    /**
     * 获取第三方系统所有角色（用于"角色报表"管理页下拉/列表）。
     * <p>返回模拟的角色列表。
     *
     * @return 全量角色列表；获取失败返回空列表
     */
    @Override
    public List<RoleInfo> listAllRoles() {
        List<RoleInfo> roles = new ArrayList<>();
        roles.add(new RoleInfo("admin", "管理员"));
        roles.add(new RoleInfo("user", "普通用户"));
        roles.add(new RoleInfo("test", "测试角色"));
        return roles;
    }

    /**
     * Token 信息内部类，存储用户名和过期时间。
     */
    private static class TokenInfo {
        final String username;
        final long expirationTime;

        TokenInfo(String username, long expirationTime) {
            this.username = username;
            this.expirationTime = expirationTime;
        }
    }
}
