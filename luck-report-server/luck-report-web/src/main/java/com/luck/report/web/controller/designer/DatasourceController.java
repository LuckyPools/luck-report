package com.luck.report.web.controller.designer;

import com.luck.report.core.definition.dataset.Field;
import com.luck.report.core.exception.ReportServiceException;
import com.luck.report.web.domain.vo.dataset.DataResult;
import com.luck.report.web.domain.vo.request.BuildDatabaseTablesRequest;
import com.luck.report.web.domain.vo.request.BuildFieldsRequest;
import com.luck.report.web.domain.vo.request.PreviewDataRequest;
import com.luck.report.web.domain.vo.request.TestConnectionRequest;
import com.luck.report.web.service.DatasourceService;
import com.luck.report.web.utils.ResponseUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * 数据源控制器，仅负责HTTP请求/响应转换与参数接收，业务逻辑委托给DatasourceService
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
    public void loadBuildinDatasources(HttpServletResponse resp) throws IOException {
        List<String> datasources = datasourceService.loadBuildinDatasources();
        ResponseUtils.writeObjectToJson(resp, datasources);
    }

    /**
     * 加载Bean方法
     */
    @RequestMapping("/loadMethods")
    public void loadMethods(@RequestParam("beanId") String beanId, HttpServletResponse resp) throws IOException {
        List<String> result = datasourceService.loadMethods(beanId);
        ResponseUtils.writeObjectToJson(resp, result);
    }

    /**
     * 构建类字段
     */
    @RequestMapping("/buildClass")
    public void buildClass(@RequestParam("clazz") String clazz, HttpServletResponse resp) throws IOException {
        List<Field> result = datasourceService.buildClass(clazz);
        ResponseUtils.writeObjectToJson(resp, result);
    }

    /**
     * 构建数据库表
     */
    @RequestMapping("/buildDatabaseTables")
    public void buildDatabaseTables(BuildDatabaseTablesRequest req, HttpServletResponse resp) throws ReportServiceException, IOException {
        List<Map<String, String>> tables = datasourceService.buildDatabaseTables(req);
        ResponseUtils.writeObjectToJson(resp, tables);
    }

    /**
     * 构建字段
     */
    @RequestMapping("/buildFields")
    public void buildFields(BuildFieldsRequest req, HttpServletResponse resp) throws IOException {
        List<Field> fields = datasourceService.buildFields(req);
        ResponseUtils.writeObjectToJson(resp, fields);
    }

    /**
     * 预览数据
     */
    @RequestMapping("/previewData")
    public void previewData(PreviewDataRequest req, HttpServletResponse resp) throws ReportServiceException, IOException {
        DataResult result = datasourceService.previewData(req);
        ResponseUtils.writeObjectToJson(resp, result);
    }

    /**
     * 测试数据库连接
     */
    @RequestMapping("/testConnection")
    public void testConnection(@RequestParam(value = "username", required = false) String username,
                               @RequestParam(value = "password", required = false) String password,
                               @RequestParam("driver") String driver,
                               @RequestParam("url") String url,
                               HttpServletResponse resp) throws IOException {
        TestConnectionRequest req = new TestConnectionRequest(username, password, driver, url);
        Map<String, Object> result = datasourceService.testConnection(req);
        ResponseUtils.writeObjectToJson(resp, result);
    }
}
