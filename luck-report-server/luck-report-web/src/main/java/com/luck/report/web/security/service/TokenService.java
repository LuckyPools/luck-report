package com.luck.report.web.security.service;

import com.luck.report.web.modules.role.domain.dto.RoleInfo;
import com.luck.report.web.security.domain.LoginUser;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;

/**
 * 报表访问 Token 服务 SPI。
 * <p>业务方可整体替换为自定义实现（如对接 OAuth2、调用外部 IAM、Redis 存储等），
 * 框架只依赖该接口的方法。
 * <p><b>所有方法的实现策略（生成算法、存储介质、校验逻辑等）均由实现方决定，
 * 框架不规定具体策略。</b>
 * <p>Bean 名：{@code bean.tokenService}。
 *
 * @author luck-report
 * @since 1.0.0
 */
public interface TokenService {

    /**
     * 签发 token。
     * <p><b>由第三方实现决定如何从 request 中提取用户身份、权限范围等信息。</b>
     * <p>实现方可从以下位置获取信息：
     * <ul>
     *   <li>Session：当前登录用户 ID、角色等</li>
     *   <li>Header：自定义的认证信息</li>
     *   <li>请求参数：scope、reports 等</li>
     *   <li>配置：默认的 ttlSeconds、tenantId 等</li>
     * </ul>
     *
     * @param request HTTP 请求（包含用户身份、请求参数等）
     * @return token 字符串；生成失败返回 null
     */
    String generateToken(HttpServletRequest request);

    /**
     * 校验 token 是否有效。
     * <p>校验逻辑由实现方决定：
     * <ul>
     *   <li>验签（如 JWT）</li>
     *   <li>过期时间校验</li>
     *   <li>黑名单检查</li>
     *   <li>在线状态检查（如 Redis 存储）</li>
     * </ul>
     *
     * @param token 待校验 token
     * @return true 表示有效；false 表示无效或已过期
     */
    boolean verifyToken(String token);

    /**
     * 获取当前请求的登录用户信息。
     * <p>由第三方实现：从 Session / Token claims / Header 等任意位置解析当前登录用户，
     * 返回包含用户 ID 和角色列表的 {@link LoginUser} 对象。
     * <p>此方法是 SPI 的核心方法，第三方应优先实现该方法，
     * 框架会从该方法中提取用户 ID 和角色用于数据隔离与权限校验。
     *
     * @param request HTTP 请求
     * @return LoginUser 对象（包含 id 和 roles）；未登录或解析失败返回 null
     */
    default LoginUser getCurrentUser(HttpServletRequest request) {
        return null;
    }

    /**
     * 获取当前请求用户的角色编码列表。
     * <p>默认实现从 {@link #getCurrentUser(HttpServletRequest)} 中提取角色列表，
     * 第三方只需实现 getCurrentUser 即可自动适配。
     *
     * @param request HTTP 请求
     * @return 角色编码列表；未登录或解析失败返回空列表
     * @deprecated 请实现 {@link #getCurrentUser(HttpServletRequest)}，
     *             框架会自动从 LoginUser.roles 中取值
     */
    @Deprecated
    default List<String> getCurrentUserRoles(HttpServletRequest request) {
        LoginUser user = getCurrentUser(request);
        return user != null ? user.getRoles() : Collections.emptyList();
    }

    /**
     * 获取当前请求用户的 ID。
     * <p>默认实现从 {@link #getCurrentUser(HttpServletRequest)} 中提取用户 ID，
     * 第三方只需实现 getCurrentUser 即可自动适配。
     *
     * @param request HTTP 请求
     * @return 用户 ID 字符串；未登录或解析失败返回 null
     * @deprecated 请实现 {@link #getCurrentUser(HttpServletRequest)}，
     *             框架会自动从 LoginUser.id 中取值
     */
    @Deprecated
    default String getCurrentUserId(HttpServletRequest request) {
        LoginUser user = getCurrentUser(request);
        return user != null ? user.getId() : null;
    }

    /**
     * 获取第三方系统所有角色（用于"角色报表"管理页下拉/列表）。
     * <p>由第三方实现：调用第三方角色管理接口或查第三方角色表。
     *
     * @return 全量角色列表；获取失败返回空列表
     */
    default List<RoleInfo> listAllRoles() {
        return Collections.emptyList();
    }
}