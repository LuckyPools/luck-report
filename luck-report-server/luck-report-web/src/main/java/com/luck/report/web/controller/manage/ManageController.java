package com.luck.report.web.controller.manage;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.web.domain.dto.ReportQueryDTO;
import com.luck.report.web.service.ReportManageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

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
     * 查询报表来源列表
     */
    @RequestMapping("/loadReportProviders")
    public ResultVO<List<Map<String, Object>>> loadReportProviders() {
        return ResultVO.success(reportManageService.loadReportProviders());
    }

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
}
