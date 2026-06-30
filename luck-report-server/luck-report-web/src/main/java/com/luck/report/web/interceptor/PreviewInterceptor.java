package com.luck.report.web.interceptor;

import com.luck.report.web.exception.AuthException;
import com.luck.report.web.security.ReportAccessChecker;
import com.luck.report.web.security.TokenProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 预览/导出权限拦截器。
 * <p>拦截预览和导出相关请求，校验用户是否有权访问指定报表。
 * <p>校验逻辑：调用 {@link ReportAccessChecker#canPreview} 做四层校验（管理员 / * 通配 / 精确匹配）。
 * <p>URL pattern：{@code /html/**}, {@code /chart/**}, {@code /excel/**}, {@code /pdf/**}, {@code /word/**}, {@code /image/**}。
 * <p>order=3（在 ManageInterceptor 之后），确保管理端请求已被拦截器分流。
 * <p>权限拒绝时抛出 {@link AuthException}，由 {@code ReportExceptionHandler} 统一处理。
 *
 * @author luck-report
 * @since 1.2.0
 */
@Slf4j
public class PreviewInterceptor implements HandlerInterceptor {

    private final ReportAccessChecker accessChecker;
    private final TokenProperties tokenProperties;

    public PreviewInterceptor(ReportAccessChecker accessChecker, TokenProperties tokenProperties) {
        this.accessChecker = accessChecker;
        this.tokenProperties = tokenProperties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        // 1. 总开关关闭时跳过
        if (tokenProperties == null || !tokenProperties.isEnabled()) {
            return true;
        }

        // 2. 从请求参数中获取 filePath（带 provider 前缀）
        String filePath = extractFilePath(request);
        if (filePath == null || filePath.isEmpty()) {
            // 无 filePath 参数的请求（如预览首页）直接放行
            return true;
        }

        // 3. 权限校验
        if (!accessChecker.canPreview(request, filePath)) {
            log.warn("报表预览/导出权限拒绝: filePath={}, uri={}", filePath, request.getRequestURI());
            throw new AuthException("无权访问该报表 " + filePath);
        }

        return true;
    }

    /**
     * 从请求中提取 filePath 参数。
     * <p>预览 URL 格式：
     * <ul>
     *   <li>{@code /ureport/preview?_u=file:test.ureport.xml}</li>
     *   <li>{@code /ureport/preview?_u=db:1}</li>
     *   <li>{@code /ureport/preview?_u=classpath:xxx.ureport.xml}</li>
     * </ul>
     *
     * @param request HTTP 请求
     * @return 带 provider 前缀的 filePath；不存在返回 null
     */
    private String extractFilePath(HttpServletRequest request) {
        String filePath = request.getParameter("filePath");
        if (filePath != null && !filePath.isEmpty()) {
            return filePath;
        }
        // 兼容其他可能的参数名
        filePath = request.getParameter("file");
        if (filePath != null && !filePath.isEmpty()) {
            return filePath;
        }
        return null;
    }
}
