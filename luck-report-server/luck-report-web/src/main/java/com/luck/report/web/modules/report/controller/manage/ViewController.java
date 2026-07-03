package com.luck.report.web.modules.report.controller.manage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.thymeleaf.context.WebContext;
import org.thymeleaf.spring5.SpringTemplateEngine;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

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
 * 壳模板位于 {@code classpath:/html/} 下，由独立的 Thymeleaf 引擎渲染：
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
 * <p>
 * 使用独立的 {@code luckReportTemplateEngine} 进行渲染，不依赖 Spring Boot 的
 * Thymeleaf 自动配置，确保第三方项目无需额外配置即可使用。
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
     * LuckReport 专用的 Thymeleaf 模板引擎，不与第三方项目的模板引擎冲突。
     */
    @Autowired
    @Qualifier("bean.luckReportTemplateEngine")
    private SpringTemplateEngine templateEngine;

    /**
     * 报表设计器入口（前端路由 /report/designer）。
     * <p>匹配 {@code /designer} 及任意子路径（如携带 {@code ?reportPath=xxx}），
     * 全部渲染 {@code classpath:/html/designer.html}。
     */
    @GetMapping({"/designer", "/designer/**"})
    public void designer(HttpServletRequest request, HttpServletResponse response) throws IOException {
        renderTemplate("designer", request, response);
    }

    /**
     * 报表预览入口（前端路由 /report/preview）。
     * <p>匹配 {@code /preview} 及任意子路径，全部渲染 {@code classpath:/html/preview.html}。
     */
    @GetMapping({"/preview", "/preview/**"})
    public void preview(HttpServletRequest request, HttpServletResponse response) throws IOException {
        renderTemplate("preview", request, response);
    }

    /**
     * 工作台首页入口（前端路由 /report/manage 等）。
     * <p>匹配以下前端路由，全部渲染 {@code classpath:/html/index.html}：
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
    public void manage(HttpServletRequest request, HttpServletResponse response) throws IOException {
        renderTemplate("index", request, response);
    }

    /**
     * 使用独立的 Thymeleaf 模板引擎渲染页面。
     * <p>
     * 不走 Spring MVC 的视图解析流程，直接使用 {@code luckReportTemplateEngine} 手动渲染，
     * 确保与第三方项目的模板引擎完全隔离。
     *
     * @param templateName 模板名称（不含后缀）
     * @param request      HTTP 请求
     * @param response     HTTP 响应
     * @throws IOException 渲染异常
     */
    private void renderTemplate(String templateName, HttpServletRequest request,
                                HttpServletResponse response) throws IOException {
        // 构建 Thymeleaf WebContext
        WebContext context = new WebContext(request, response, request.getServletContext());

        // 注入模板变量
        String token = request.getParameter("token");
        String baseURL = request.getContextPath()
                + (servletPrefix == null || servletPrefix.isEmpty() ? "" : "/" + servletPrefix);
        context.setVariable("token", token == null ? "" : token);
        context.setVariable("baseURL", baseURL);
        context.setVariable("servletPrefix", servletPrefix == null ? "" : servletPrefix);

        // 设置响应类型
        response.setContentType("text/html;charset=UTF-8");

        // 使用独立模板引擎渲染
        templateEngine.process(templateName, context, response.getWriter());
    }
}
