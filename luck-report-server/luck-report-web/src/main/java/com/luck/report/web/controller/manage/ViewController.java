package com.luck.report.web.controller.manage;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 管理控制器
 * <p>
 * 提供两类入口：
 * <ol>
 *   <li>报表前端 SPA 页面入口：{@code /designer}、{@code /preview}，由 Thymeleaf 解析为
 *       {@code classpath:/html/designer.html}、{@code classpath:/html/preview.html}。
 *       替代原 {@code ImageServletAction} 设计器入口。</li>
 *   <li>（预留）后续如需在 manage 命名空间下提供 JSON / 文件类管理接口，可继续在本类补充。</li>
 * </ol>
 * <p>
 * 路径前缀 {@code servletPrefix} 通过 {@code @RequestMapping} 占位注入，
 * 与全工程其他 {@code *Controller}（DesignerController、ChatController 等）保持一致；
 * 当前值取自 {@code luck-report-pub/src/main/resources/application-dev.yml} 的
 * {@code luck-report.servletPrefix}，默认 {@code report}。
 *
 * @author Jacky.gao
 * @since 2017年1月25日
 */
@Controller("bean.viewController")
@RequestMapping("${luck-report.servletPrefix:}/view")
public class ViewController {

    /**
     * 设计器页面入口
     * <p>匹配 {@code /designer} 与任意子路径（{@code /designer/xxx}），
     * 全部返回 {@code designer} 视图名，由 Thymeleaf 解析为
     * {@code classpath:/html/designer.html}。
     *
     * @return Thymeleaf 视图名 {@code designer}
     */
    @GetMapping({"/designer", "/designer/**"})
    public String designer() {
        return "designer";
    }

    /**
     * 预览页面入口
     * <p>匹配 {@code /preview} 与任意子路径（{@code /preview/xxx}），
     * 全部返回 {@code preview} 视图名，由 Thymeleaf 解析为
     * {@code classpath:/html/preview.html}。
     *
     * @return Thymeleaf 视图名 {@code preview}
     */
    @GetMapping({"/preview", "/preview/**"})
    public String preview() {
        return "preview";
    }
}
