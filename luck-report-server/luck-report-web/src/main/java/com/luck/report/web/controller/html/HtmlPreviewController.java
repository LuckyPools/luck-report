package com.luck.report.web.controller.html;

import com.luck.report.core.definition.Paper;
import com.luck.report.web.domain.vo.report.HtmlReportVo;
import com.luck.report.web.service.HtmlPreviewService;
import com.luck.report.web.utils.ResponseUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * HTML预览控制器，仅负责HTTP请求/响应转换，业务逻辑委托给HtmlPreviewService
 */
@RestController("bean.htmlPreviewController")
@RequestMapping("${luck-report.servletPrefix:}/html")
public class HtmlPreviewController {

    @Autowired
    @Qualifier("bean.htmlPreviewService")
    private HtmlPreviewService htmlPreviewService;

    /**
     * 加载HTML预览内容
     */
    @RequestMapping("/loadHtml")
    public void loadHtml(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pageIndex = req.getParameter("_i");
        String mode = req.getParameter("mode");
        HtmlReportVo vo = htmlPreviewService.loadHtml(req, pageIndex, mode);
        ResponseUtils.writeObjectToJson(resp, vo);
    }

    /**
     * 加载打印页HTML
     */
    @RequestMapping("/loadPrintPages")
    public void loadPrintPages(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String mode = req.getParameter("mode");
        String html = htmlPreviewService.loadPrintPages(req, mode);
        Map<String, String> map = new HashMap<>(2);
        map.put("html", html);
        ResponseUtils.writeObjectToJson(resp, map);
    }

    /**
     * 加载报表纸张信息
     */
    @RequestMapping("/loadPagePaper")
    public void loadPagePaper(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String mode = req.getParameter("mode");
        Paper paper = htmlPreviewService.loadPagePaper(req, mode);
        ResponseUtils.writeObjectToJson(resp, paper);
    }

    /**
     * 加载数据
     */
    @RequestMapping("/loadData")
    public void loadData(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pageIndex = req.getParameter("_i");
        String mode = req.getParameter("mode");
        HtmlReportVo vo = htmlPreviewService.loadData(req, pageIndex, mode);
        ResponseUtils.writeObjectToJson(resp, vo);
    }
}
