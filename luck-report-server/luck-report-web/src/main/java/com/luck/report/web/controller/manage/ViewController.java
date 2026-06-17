package com.luck.report.web.controller.manage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.http.HttpServletRequest;

/**
 * 报表前端页面入口控制器
 * <p>
 * 前端使用 HTML5 History 模式路由，路径为：
 * <ul>
 *   <li>{@code /report/designer} - 报表设计器</li>
 *   <li>{@code /report/preview} - 报表预览</li>
 *   <li>{@code /report/manage} - 报表管理（工作台首页）</li>
 *   <li>{@code /report/datasource} - 数据源管理</li>
 *   <li>{@code /report/model-config} - 模型管理</li>
 *   <li>{@code /report/business-knowledge} - 业务知识库</li>
 *   <li>{@code /report/agent-knowledge} - Agent 知识库</li>
 * </ul>
 * <p>
 * 同时保留兼容路径 {@code /view/**} 供第三方 iframe 嵌入使用：
 * <ul>
 *   <li>{@code /view}、{@code /view/index}：工作台首页</li>
 *   <li>{@code /view/designer}：报表设计器</li>
 *   <li>{@code /view/preview}：报表预览</li>
 * </ul>
 * <p>
 * 路径前缀 {@code luck-report.servletPrefix} 与工程内其它 Controller 保持一致，
 * 默认值 {@code report}，由 {@code luck-report-pub/application-dev.yml} 注入。
 * <p>
 * 壳模板位于 {@code classpath:/html/} 下，由 Thymeleaf 解析：
 * <ul>
 *   <li>{@code index.html} - 工作台壳模板</li>
 *   <li>{@code designer.html} - 设计器壳模板</li>
 *   <li>{@code preview.html} - 预览壳模板</li>
 * </ul>
 * 三个壳模板共用的前端构建产物：
 * <ul>
 *   <li>{@code classpath:/html/lib/vendor.js} - vendor IIFE：把 vue/antd/pinia/axios
 *       等 vite lib 标记为 external 的依赖挂到 window 全局</li>
 *   <li>{@code classpath:/html/lib/luck-report-ui.umd.js} - vite lib 模式 UMD 主体</li>
 *   <li>{@code classpath:/html/lib/style.css} - 全部 CSS（antd reset + iconfont + 公共）</li>
 * </ul>
 * 模板里通过 Thymeleaf 注入 {@code token} / {@code baseURL}，由前端
 * {@code LuckReport.mount(...)} 消费。
 */
@Controller("bean.viewController")
@RequestMapping("${luck-report.servletPrefix:}")
public class ViewController {

    /**
     * 后台 servlet 前缀，默认 {@code report}，与 {@code luck-report.servletPrefix} 同源。
     * 注入到模板的 {@code baseURL} 供前端 axios 使用，对应后端 API 网关前缀。
     */
    @Value("${luck-report.servletPrefix:report}")
    private String servletPrefix;

    /**
     * 报表设计器入口（前端路由 /report/designer）。
     * <p>匹配 {@code /designer} 及任意子路径（如携带 {@code ?reportPath=xxx}），
     * 全部返回 {@code designer} 视图名，Thymeleaf 解析为 {@code classpath:/html/designer.html}。
     */
    @GetMapping({"/designer", "/designer/**"})
    public String designer(HttpServletRequest request, Model model) {
        populateModel(request, model);
        return "designer";
    }

    /**
     * 报表预览入口（前端路由 /report/preview）。
     * <p>匹配 {@code /preview} 及任意子路径，全部返回 {@code preview} 视图名，
     * Thymeleaf 解析为 {@code classpath:/html/preview.html}。
     */
    @GetMapping({"/preview", "/preview/**"})
    public String preview(HttpServletRequest request, Model model) {
        populateModel(request, model);
        return "preview";
    }

    /**
     * 工作台首页入口（前端路由 /report/manage 等）。
     * <p>匹配以下前端路由，全部返回 {@code index} 视图名：
     * <ul>
     *   <li>{@code /manage} - 报表管理</li>
     *   <li>{@code /datasource} - 数据源管理</li>
     *   <li>{@code /model-config} - 模型管理</li>
     *   <li>{@code /business-knowledge} - 业务知识库</li>
     *   <li>{@code /agent-knowledge} - Agent 知识库</li>
     * </ul>
     */
    @GetMapping({
        "/manage", "/manage/**",
        "/datasource", "/datasource/**",
        "/model-config", "/model-config/**",
        "/business-knowledge", "/business-knowledge/**",
        "/agent-knowledge", "/agent-knowledge/**"
    })
    public String manage(HttpServletRequest request, Model model) {
        populateModel(request, model);
        return "index";
    }

    // ==================== 兼容路径 /view/**（供第三方 iframe 嵌入） ====================

    /**
     * 兼容路径：工作台首页入口。
     * <p>匹配 {@code /view}、{@code /view/index} 及任意子路径，
     * 全部返回 {@code index} 视图名，Thymeleaf 解析为 {@code classpath:/html/index.html}。
     * <p>推荐给第三方系统 iframe 嵌入使用，配合 {@code ?token=xxx} 透传身份。
     */
    @GetMapping({"/view", "/view/", "/view/index", "/view/index/**"})
    public String viewIndex(HttpServletRequest request, Model model) {
        populateModel(request, model);
        return "index";
    }

    /**
     * 兼容路径：报表设计器入口。
     * <p>匹配 {@code /view/designer} 及任意子路径（如携带 {@code ?reportPath=xxx}），
     * 全部返回 {@code designer} 视图名，Thymeleaf 解析为 {@code classpath:/html/designer.html}。
     */
    @GetMapping({"/view/designer", "/view/designer/**"})
    public String viewDesigner(HttpServletRequest request, Model model) {
        populateModel(request, model);
        return "designer";
    }

    /**
     * 兼容路径：报表预览入口。
     * <p>匹配 {@code /view/preview} 及任意子路径，全部返回 {@code preview} 视图名，
     * Thymeleaf 解析为 {@code classpath:/html/preview.html}。
     */
    @GetMapping({"/view/preview", "/view/preview/**"})
    public String viewPreview(HttpServletRequest request, Model model) {
        populateModel(request, model);
        return "preview";
    }

    /**
     * 把 token / baseURL / servletPrefix 注入到模板。
     * <ul>
     *   <li>{@code token} - 从 query string 透传给前端，第三方 iframe 通过
     *       {@code ?token=xxx} 传入身份凭据</li>
     *   <li>{@code baseURL} - 形如 {@code /report}，作为前端 axios baseURL，
     *       拼到所有后端 API 请求前缀</li>
     *   <li>{@code servletPrefix} - 后台 servlet 前缀（默认 {@code report}），
     *       供模板拼静态资源 URL（{@code /<prefix>/lib/**}），与
     *       {@code spring.mvc.static-path-pattern} 保持一致</li>
     * </ul>
     */
    private void populateModel(HttpServletRequest request, Model model) {
        String token = request.getParameter("token");
        String baseURL = request.getContextPath()
                + (servletPrefix == null || servletPrefix.isEmpty() ? "" : "/" + servletPrefix);
        model.addAttribute("token", token == null ? "" : token);
        model.addAttribute("baseURL", baseURL);
        model.addAttribute("servletPrefix", servletPrefix == null ? "" : servletPrefix);
    }
}
