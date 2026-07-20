package com.luck.report.web.controller.html;

import com.luck.report.core.definition.Paper;
import com.luck.report.web.domain.vo.report.HtmlReportVo;
import com.luck.report.web.provider.RequestInfoProvider;
import com.luck.report.web.provider.ResponseInfoProvider;
import com.luck.report.web.service.HtmlPreviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public void loadHtml(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        String pageIndex = req.getParameter("_i");
        String mode = req.getParameter("mode");
        HtmlReportVo vo = htmlPreviewService.loadHtml(req, pageIndex, mode);
        resp.writeObjectToJson(vo);
    }

    /**
     * 加载打印页HTML
     */
    @RequestMapping("/loadPrintPages")
    public void loadPrintPages(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        String mode = req.getParameter("mode");
        String html = htmlPreviewService.loadPrintPages(req, mode);
        Map<String, String> map = new HashMap<>(2);
        map.put("html", html);
        resp.writeObjectToJson(map);
    }

    /**
     * 加载报表纸张信息
     */
    @RequestMapping("/loadPagePaper")
    public void loadPagePaper(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        String mode = req.getParameter("mode");
        Paper paper = htmlPreviewService.loadPagePaper(req, mode);
        resp.writeObjectToJson(paper);
    }

    /**
     * 加载数据
     */
    @RequestMapping("/loadData")
    public void loadData(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        String pageIndex = req.getParameter("_i");
        String mode = req.getParameter("mode");
        HtmlReportVo vo = htmlPreviewService.loadData(req, pageIndex, mode);
        resp.writeObjectToJson(vo);
    }
}
