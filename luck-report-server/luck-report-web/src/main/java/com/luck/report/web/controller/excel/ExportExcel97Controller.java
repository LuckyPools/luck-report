package com.luck.report.web.controller.excel;

import com.luck.report.web.provider.RequestInfoProvider;
import com.luck.report.web.provider.ResponseInfoProvider;
import com.luck.report.web.service.ReportExportService;
import com.luck.report.web.utils.DownloadUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.OutputStream;

/**
 * Excel 97-2003导出控制器，仅负责HTTP请求/响应转换，业务逻辑委托给ReportExportService
 */
@RestController("bean.exportExcel97Controller")
@RequestMapping("${luck-report.servletPrefix:}/excel97")
public class ExportExcel97Controller {

    @Autowired
    @Qualifier("bean.reportExportService")
    private ReportExportService reportExportService;

    @RequestMapping("/build")
    public void build(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        buildExcel(req, resp, false, false);
    }

    @RequestMapping("/paging")
    public void paging(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        buildExcel(req, resp, true, false);
    }

    @RequestMapping("/sheet")
    public void sheet(RequestInfoProvider req, ResponseInfoProvider resp) throws IOException {
        buildExcel(req, resp, false, true);
    }

    /**
     * 构建Excel97报表并写入响应流
     */
    private void buildExcel(RequestInfoProvider req, ResponseInfoProvider resp, boolean withPage, boolean withSheet) throws IOException {
        String fileName = req.getParameter("reportPath");
        String mode = req.getParameter("mode");
        String excelName = req.getParameter("_n");
        DownloadUtils.buildDownloadHeader(resp, fileName, excelName, ".xls");
        fileName = com.luck.report.web.utils.UrlParameterUtils.doubleDecode(fileName);
        OutputStream outputStream = resp.getOutputStream();
        try {
            reportExportService.buildExcel97(fileName, mode, req, outputStream, withPage, withSheet);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }
}
