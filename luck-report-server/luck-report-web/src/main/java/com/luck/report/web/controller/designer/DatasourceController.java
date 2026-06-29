package com.luck.report.web.controller.designer;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.definition.dataset.Field;
import com.luck.report.core.exception.ReportServiceException;
import com.luck.report.web.domain.vo.dataset.DataResult;
import com.luck.report.web.domain.vo.request.BuildDatabaseTablesRequest;
import com.luck.report.web.domain.vo.request.BuildFieldsRequest;
import com.luck.report.web.domain.vo.request.PreviewDataRequest;
import com.luck.report.web.domain.vo.request.TestConnectionRequest;
import com.luck.report.web.service.DatasourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * 数据源控制器
 * <p>仅负责 HTTP 请求 / 响应转换与参数校验，所有业务逻辑委托给 {@link DatasourceService}。
 *
 * @author luck-report
 * @since 1.0.0
 */
@RestController("bean.datasourceController")
@RequestMapping("${luck-report.servletPrefix:}/datasource")
public class DatasourceController {

    @Autowired
    @Qualifier("bean.datasourceService")
    private DatasourceService datasourceService;

    /**
     * 加载内置数据源
     */
    @RequestMapping("/loadBuildinDatasources")
    public ResultVO<List<String>> loadBuildinDatasources() {
        return ResultVO.success(datasourceService.loadBuildinDatasources());
    }

    /**
     * 加载Bean方法
     */
    @RequestMapping("/loadMethods")
    public ResultVO<List<String>> loadMethods(@RequestParam("beanId") String beanId) {
        return ResultVO.success(datasourceService.loadMethods(beanId));
    }

    /**
     * 构建类字段
     */
    @RequestMapping("/buildClass")
    public ResultVO<List<Field>> buildClass(@RequestParam("clazz") String clazz) {
        return ResultVO.success(datasourceService.buildClass(clazz));
    }

    /**
     * 构建数据库表
     */
    @RequestMapping("/buildDatabaseTables")
    public ResultVO<List<Map<String, String>>> buildDatabaseTables(BuildDatabaseTablesRequest req) throws ReportServiceException {
        return ResultVO.success(datasourceService.buildDatabaseTables(req));
    }

    /**
     * 构建字段
     */
    @RequestMapping("/buildFields")
    public ResultVO<List<Field>> buildFields(BuildFieldsRequest req) {
        return ResultVO.success(datasourceService.buildFields(req));
    }

    /**
     * 预览数据
     */
    @RequestMapping("/previewData")
    public ResultVO<DataResult> previewData(PreviewDataRequest req) throws ReportServiceException, IOException {
        return ResultVO.success(datasourceService.previewData(req));
    }

    /**
     * 测试数据库连接
     */
    @RequestMapping("/testConnection")
    public ResultVO<Map<String, Object>> testConnection(TestConnectionRequest req) {
        return ResultVO.success(datasourceService.testConnection(req));
    }
}
