package com.luck.report.web.controller.html;

import com.luck.report.core.definition.Paper;
import com.luck.report.web.controller.base.BaseController;
import com.luck.report.web.domain.vo.report.HtmlReportVo;
import com.luck.report.web.domain.vo.report.SearchFormOptionsVo;
import com.luck.report.web.domain.vo.request.SearchFormOptionsRequest;
import com.luck.report.web.service.HtmlPreviewService;
import com.luck.report.web.service.SearchFormOptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestBody;
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
public class HtmlPreviewController extends BaseController {

    @Autowired
    @Qualifier("bean.htmlPreviewService")
    private HtmlPreviewService htmlPreviewService;

    @Autowired
    @Qualifier("bean.searchFormOptionService")
    private SearchFormOptionService searchFormOptionService;

    /**
     * 加载HTML预览内容
     */
    @RequestMapping("/loadHtml")
    public void loadHtml() throws IOException {
        String pageIndex = req.getParameter("_i");
        String mode = req.getParameter("mode");
        HtmlReportVo vo = htmlPreviewService.loadHtml(req, pageIndex, mode);
        resp.writeObjectToJson(vo);
    }

    /**
     * 加载打印页HTML
     */
    @RequestMapping("/loadPrintPages")
    public void loadPrintPages() throws IOException {
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
    public void loadPagePaper() throws IOException {
        String mode = req.getParameter("mode");
        Paper paper = htmlPreviewService.loadPagePaper(req, mode);
        resp.writeObjectToJson(paper);
    }

    /**
     * 加载数据
     */
    @RequestMapping("/loadData")
    public void loadData() throws IOException {
        String pageIndex = req.getParameter("_i");
        String mode = req.getParameter("mode");
        HtmlReportVo vo = htmlPreviewService.loadData(req, pageIndex, mode);
        resp.writeObjectToJson(vo);
    }

    /**
     * 批量加载查询表单选项：按报表文件 + 数据集引用执行数据集，返回 label/value 选项
     */
    @RequestMapping("/loadSearchFormOptions")
    public void loadSearchFormOptions(@RequestBody SearchFormOptionsRequest request) throws IOException {
        SearchFormOptionsVo vo = searchFormOptionService.loadOptions(request);
        resp.writeObjectToJson(vo);
    }
}
