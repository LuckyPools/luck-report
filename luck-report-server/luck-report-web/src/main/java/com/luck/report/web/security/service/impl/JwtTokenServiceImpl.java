package com.luck.report.web.security.service.impl;

import com.luck.report.web.modules.role.domain.dto.RoleInfo;
import com.luck.report.web.security.domain.LoginUser;
import com.luck.report.web.security.service.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;

/**
 * 框架默认的 TokenService 空实现（占位符）。
 * <p>此类仅作为 Spring Bean 注册的占位实现，确保框架能正常启动。
 * <p>Bean 名：{@code bean.tokenService}。
 * <p><b>第三方业务方必须提供自定义实现并标记 @Primary 来覆盖此默认实现。</b>
 * <p>以下所有方法均返回空值或默认值，实际业务逻辑由第三方实现提供：
 * <ul>
 *   <li>{@link #generateToken(HttpServletRequest)} - 返回 null，第三方应实现 token 生成逻辑</li>
 *   <li>{@link #verifyToken(String)} - 返回 false，第三方应实现 token 校验逻辑</li>
 *   <li>{@link #getCurrentUser(HttpServletRequest)} - 返回固定 ID "1"，第三方应从 Session/Header/Token 中解析真实用户</li>
 *   <li>{@link #listAllRoles()} - 返回空列表，第三方应调用第三方角色管理接口获取全量角色</li>
 * </ul>
 *
 * @author luck-report
 * @since 1.0.0
 */
@Component("bean.tokenService")
public class JwtTokenServiceImpl implements TokenService {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenServiceImpl.class);

    public JwtTokenServiceImpl() {
        log.warn("[LuckReport-Token] 使用默认空实现 JwtTokenServiceImpl。" +
                "请提供自定义 TokenService 实现（标记 @Primary）以替换此占位实现。");
    }

    /**
     * 签发 token（空实现，返回 null）。
     * <p>第三方业务方应提供自定义实现，从 Session/Header/请求参数中提取用户身份、权限范围等信息生成 token。
     *
     * @param request HTTP 请求
     * @return null（占位实现）
     */
    @Override
    public String generateToken(HttpServletRequest request) {
        log.warn("[LuckReport-Token] generateToken 空实现被调用，请提供自定义 TokenService 实现");
        return null;
    }

    /**
     * 校验 token 是否有效（空实现，返回 false）。
     * <p>第三方业务方应提供自定义实现，根据第三方系统的 token 校验逻辑判断 token 有效性。
     *
     * @param token 待校验 token
     * @return false（占位实现）
     */
    @Override
    public boolean verifyToken(String token) {
        log.warn("[LuckReport-Token] verifyToken 空实现被调用，请提供自定义 TokenService 实现");
        return false;
    }

    /**
     * 获取当前请求的登录用户信息（占位实现，返回固定 ID "1"）。
     * <p>第三方业务方应提供自定义实现，从 Session / Token claims / Header 等位置解析真实用户信息。
     * <p>默认返回 ID 为 "1"、无角色的 LoginUser 仅用于本地调试与单用户场景，生产环境必须由第三方覆盖。
     *
     * @param request HTTP 请求
     * @return new LoginUser("1", Collections.emptyList())（占位实现）
     */
    @Override
    public LoginUser getCurrentUser(HttpServletRequest request) {
        return new LoginUser("1", Collections.emptyList());
    }

    /**
     * 获取第三方系统所有角色（空实现，返回空列表）。
     * <p>第三方业务方应提供自定义实现，调用第三方角色管理接口或查第三方角色表。
     *
     * @return 空列表（占位实现）
     */
    @Override
    public List<RoleInfo> listAllRoles() {
        log.warn("[LuckReport-Token] listAllRoles 空实现被调用，请提供自定义 TokenService 实现");
        return Collections.emptyList();
    }
}