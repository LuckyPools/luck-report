package com.luck.report.web.modules.report.constant;

/**
 * 报表 URL 路径常量。
 * <p>集中维护管理端和预览端两份 URL 路径段，供 WebConfig、TokenInterceptor、ManageInterceptor、PreviewInterceptor 统一引用。
 * <p>新增 Controller 时，只需往对应数组追加路径段，所有拦截器注册和路径判断自动生效。
 *
 * @author luck-report
 * @since 1.2.0
 */
public final class ReportUrls {

    /**
     * 管理端路径段（设计器/管理/配置等，需 admin 角色）。
     */
    private static final String[] MANAGE_URLS = {
            "/manage", "/designer", "/datasource", "/model-config",
            "/business-knowledge", "/agent-knowledge", "/vector",
            "/role", "/chat", "/sessions", "/import"
    };

    /**
     * 预览/导出路径段（报表预览/PDF/Excel 等，需报表授权）。
     */
    private static final String[] PREVIEW_URLS = {
            "/preview", "/html", "/chart", "/excel", "/excel97",
            "/pdf", "/word", "/image"
    };

    /**
     * Request attribute key：报表是否为匿名报表（Boolean）。
     * <p>由 TokenInterceptor（order=1）写入，PreviewInterceptor（order=3）读取，避免重复查库。
     */
    public static final String ATTR_ANONYMOUS_REPORT = "luck-report.anonymousReport";

    private ReportUrls() {
    }

    /**
     * 生成管理端 pathPattern 数组。
     * <p>示例：{@code managePathPatterns("report")} → {@code ["/report/manage/**", "/report/designer/**", ...]}
     */
    public static String[] managePathPatterns(String prefix) {
        return buildPathPatterns(prefix, MANAGE_URLS);
    }

    /**
     * 生成预览端 pathPattern 数组。
     * <p>示例：{@code previewPathPatterns("report")} → {@code ["/report/preview/**", "/report/html/**", ...]}
     */
    public static String[] previewPathPatterns(String prefix) {
        return buildPathPatterns(prefix, PREVIEW_URLS);
    }

    /**
     * 判断给定 URI 是否属于管理端路径。
     */
    public static boolean isManagePath(String uri) {
        return matchUri(uri, MANAGE_URLS);
    }

    /**
     * 判断给定 URI 是否属于预览/导出路径。
     */
    public static boolean isPreviewPath(String uri) {
        return matchUri(uri, PREVIEW_URLS);
    }

    private static String[] buildPathPatterns(String prefix, String[] segments) {
        String[] patterns = new String[segments.length];
        for (int i = 0; i < segments.length; i++) {
            patterns[i] = "/" + prefix + segments[i] + "/**";
        }
        return patterns;
    }

    private static boolean matchUri(String uri, String[] segments) {
        if (uri == null) {
            return false;
        }
        for (String segment : segments) {
            if (uri.contains(segment + "/") || uri.endsWith(segment)) {
                return true;
            }
        }
        return false;
    }
}
