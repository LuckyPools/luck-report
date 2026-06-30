package com.luck.report.web.modules.report.controller.excel;

import com.luck.report.web.modules.report.service.ReportExportService;
import com.luck.report.web.utils.DownloadUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;

/**
 * Excel导出控制器
 * <p>仅负责 HTTP 请求 / 响应转换，业务逻辑委托给 {@link ReportExportService}。
 */
@RestController("bean.exportExcelController")
@RequestMapping("${luck-report.servletPrefix:}/excel")
public class ExportExcelController {

    @Autowired
    @Qualifier("bean.reportExportService")
    private ReportExportService reportExportService;

    /**
     * 构建Excel报表
     */
    @RequestMapping("/build")
    public void build(@RequestParam("filePath") String filePath,
                      @RequestParam(value = "_m", required = false) String mode,
                      @RequestParam(value = "_n", required = false) String excelName,
                      HttpServletRequest req,
                      HttpServletResponse resp) throws IOException {
        buildExcel(filePath, mode, excelName, req, resp, false, false);
    }

    /**
     * 分页导出Excel报表
     */
    @RequestMapping("/paging")
    public void paging(@RequestParam("filePath") String filePath,
                       @RequestParam(value = "_m", required = false) String mode,
                       @RequestParam(value = "_n", required = false) String excelName,
                       HttpServletRequest req,
                       HttpServletResponse resp) throws IOException {
        buildExcel(filePath, mode, excelName, req, resp, true, false);
    }

    /**
     * 按Sheet导出Excel报表
     */
    @RequestMapping("/sheet")
    public void sheet(@RequestParam("filePath") String filePath,
                      @RequestParam(value = "_m", required = false) String mode,
                      @RequestParam(value = "_n", required = false) String excelName,
                      HttpServletRequest req,
                      HttpServletResponse resp) throws IOException {
        buildExcel(filePath, mode, excelName, req, resp, false, true);
    }

    private void buildExcel(String filePath, String mode, String excelName,
                            HttpServletRequest req, HttpServletResponse resp,
                            boolean withPage, boolean withSheet) throws IOException {
        DownloadUtils.buildDownloadHeader(resp, filePath, excelName, ".xlsx");
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildExcel(filePath, mode, req, outputStream, withPage, withSheet);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }
}
