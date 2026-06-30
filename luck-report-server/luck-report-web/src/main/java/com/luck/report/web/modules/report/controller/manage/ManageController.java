package com.luck.report.web.modules.report.controller.manage;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.core.provider.report.ReportProvider;
import com.luck.report.web.modules.report.domain.dto.ReportQueryDTO;
import com.luck.report.web.modules.report.domain.vo.report.ReportExportTemplateVo;
import com.luck.report.web.modules.report.service.ReportManageService;
import com.luck.report.web.utils.DownloadUtils;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.io.OutputStream;

/**
 * 报表管理控制器
 * <p>仅负责 HTTP 请求 / 响应转换与参数校验，业务逻辑委托给
 * {@link ReportManageService}，避免在 Controller 中堆积业务代码。
 *
 * @author luck-report
 * @since 1.0.0
 */
@RestController("bean.manageController")
@RequestMapping("/report/manage")
public class ManageController {

    @Autowired
    @Qualifier("bean.reportManageService")
    private ReportManageService reportManageService;

    /**
     * 分页查询报表列表
     */
    @PostMapping("/queryReports")
    public PageResultVO<ReportFile> queryReports(@Valid @RequestBody ReportQueryDTO queryDTO) {
        return reportManageService.queryReports(queryDTO);
    }

    /**
     * 删除报表
     */
    @RequestMapping("/deleteReport")
    public ResultVO<Void> deleteReport(@RequestParam String file) {
        return reportManageService.deleteReport(file);
    }

    /**
     * 导出报表模板源文件（XML），供前端下载。
     * <p>接收完整 filePath（带 provider 前缀），通过 {@link HttpServletResponse} 写出字节流。
     * 与 queryReports 中的 list 不同：本接口返回 XML 源文件而非渲染结果。
     */
    @RequestMapping("/exportTemplate")
    public void exportTemplate(@RequestParam("filePath") String filePath,
                               HttpServletRequest req,
                               HttpServletResponse resp) throws IOException {
        ResultVO<ReportExportTemplateVo> vo = reportManageService.exportTemplate(filePath);
        if (vo.getCode() != 0 || vo.getData() == null) {
            // 业务错误：以 JSON 形式写回 4xx/5xx
            resp.setStatus(vo.getCode() != 0 && vo.getCode() >= 400 ? vo.getCode() : 500);
            resp.setContentType("application/json;charset=UTF-8");
            String body = "{\"code\":" + vo.getCode() + ",\"message\":\"" +
                    (vo.getMessage() == null ? "" : vo.getMessage().replace("\"", "'")) + "\"}";
            resp.getWriter().write(body);
            resp.getWriter().flush();
            return;
        }
        ReportExportTemplateVo pkg = vo.getData();
        DownloadUtils.buildDownloadHeader(resp, filePath, pkg.getFileName(), ReportProvider.REPORT_FILE_SUFFIX);
        OutputStream outputStream = resp.getOutputStream();
        try {
            IOUtils.write(pkg.getContent(), outputStream);
        } finally {
            outputStream.flush();
            outputStream.close();
        }
    }

    /**
     * 导入报表模板源文件（XML）。
     * <p>接收 provider（报表来源前缀）和 file（multipart 上传），调用 provider.saveReport 写入。
     * 返回保存后的 ReportFile（path 不含 provider 前缀）。
     */
    @PostMapping(value = "/importTemplate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResultVO<ReportFile> importTemplate(@RequestParam("provider") String provider,
                                               @RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResultVO.error(400, "上传文件不能为空");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.trim().isEmpty()) {
            return ResultVO.error(400, "文件名不能为空");
        }
        // 去除路径部分，仅保留 basename
        int slashIdx = Math.max(originalName.lastIndexOf('/'), originalName.lastIndexOf('\\'));
        if (slashIdx >= 0) {
            originalName = originalName.substring(slashIdx + 1);
        }
        try {
            String content = IOUtils.toString(file.getInputStream(), "utf-8");
            return reportManageService.importTemplate(provider, originalName, content);
        } catch (IOException e) {
            return ResultVO.error(500, "读取上传文件失败: " + e.getMessage());
        }
    }
}
