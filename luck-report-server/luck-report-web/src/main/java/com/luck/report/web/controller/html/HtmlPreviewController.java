package com.luck.report.web.controller.html;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.definition.Paper;
import com.luck.report.web.domain.vo.report.HtmlReportVo;
import com.luck.report.web.service.HtmlPreviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * HTML 预览控制器
 * <p>仅负责 HTTP 请求 / 响应转换，所有业务逻辑委托给 {@link HtmlPreviewService}。
 */
@RestController("bean.htmlPreviewController")
@RequestMapping("${luck-report.servletPrefix:}/html")
public class HtmlPreviewController {

    @Autowired
    @Qualifier("bean.htmlPreviewService")
    private HtmlPreviewService htmlPreviewService;

    /**
     * 加载 HTML 预览内容
     */
    @RequestMapping("/loadHtml")
    public ResultVO<HtmlReportVo> loadHtml(@RequestParam("filePath") String filePath,
                                           @RequestParam(value = "_m", required = false) String mode,
                                           @RequestParam(value = "_i", required = false) String pageIndex,
                                           HttpServletRequest req) {
        return ResultVO.success(htmlPreviewService.loadHtml(filePath, mode, pageIndex, req));
    }

    /**
     * 加载打印页 HTML
     */
    @RequestMapping("/loadPrintPages")
    public ResultVO<Map<String, String>> loadPrintPages(@RequestParam(value = "_m", required = false) String mode,
                                                         @RequestParam("filePath") String filePath,
                                                         HttpServletRequest req) {
        Map<String, String> map = new HashMap<>(2);
        map.put("html", htmlPreviewService.loadPrintPages(filePath, mode, req));
        return ResultVO.success(map);
    }

    /**
     * 加载报表纸张信息
     */
    @RequestMapping("/loadPagePaper")
    public ResultVO<Paper> loadPagePaper(@RequestParam(value = "_m", required = false) String mode,
                                         @RequestParam("filePath") String filePath) {
        return ResultVO.success(htmlPreviewService.loadPagePaper(filePath, mode));
    }

    /**
     * 加载数据（不渲染 HTML，只返回分页信息和图表数据）
     */
    @RequestMapping("/loadData")
    public ResultVO<HtmlReportVo> loadData(@RequestParam("filePath") String filePath,
                                           @RequestParam(value = "_m", required = false) String mode,
                                           @RequestParam(value = "_i", required = false) String pageIndex,
                                           HttpServletRequest req) {
        return ResultVO.success(htmlPreviewService.loadData(filePath, mode, pageIndex, req));
    }
}
