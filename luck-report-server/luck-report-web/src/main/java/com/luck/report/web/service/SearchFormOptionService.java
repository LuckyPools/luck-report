package com.luck.report.web.service;

import com.luck.report.core.Utils;
import com.luck.report.core.build.Dataset;
import com.luck.report.core.definition.ReportDefinition;
import com.luck.report.core.definition.dataset.BeanDatasetDefinition;
import com.luck.report.core.definition.dataset.DatasetDefinition;
import com.luck.report.core.definition.dataset.JsonDatasetDefinition;
import com.luck.report.core.definition.dataset.SqlDatasetDefinition;
import com.luck.report.core.definition.datasource.BuildinDatasource;
import com.luck.report.core.definition.datasource.BuildinDatasourceDefinition;
import com.luck.report.core.definition.datasource.DatasourceDefinition;
import com.luck.report.core.definition.datasource.DatasourceProvider;
import com.luck.report.core.definition.datasource.JdbcDatasourceDefinition;
import com.luck.report.core.definition.datasource.SpringBeanDatasourceDefinition;
import com.luck.report.core.definition.datasource.StaticDatasourceDefinition;
import com.luck.report.core.definition.searchform.Option;
import com.luck.report.core.exception.ReportComputeException;
import com.luck.report.core.exception.ReportException;
import com.luck.report.core.export.ReportRender;
import com.luck.report.core.utils.JsonUtils;
import com.luck.report.web.constant.ReportConstants;
import com.luck.report.web.domain.vo.report.SearchFormOptionsVo;
import com.luck.report.web.domain.vo.request.DatasetRef;
import com.luck.report.web.domain.vo.request.SearchFormOptionsRequest;
import com.luck.report.web.utils.UrlParameterUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 查询表单选项服务：按报表文件 + 数据集引用执行数据集，返回 label/value 选项
 *
 * @author luckyPools
 * @since 2026年08月31日
 */
@Service("bean.searchFormOptionService")
public class SearchFormOptionService implements ApplicationContextAware {

    private static final Logger logger = LoggerFactory.getLogger(SearchFormOptionService.class);

    @Autowired
    private ReportRender reportRender;

    @Autowired
    private ReportDefinitionService reportDefinitionService;

    private ApplicationContext applicationContext;

    /**
     * 批量加载查询表单选项；单个数据集失败不影响其它，该项落空选项并记录错误信息
     *
     * @param request 请求（报表路径 + 数据集引用列表），可为空
     * @return key 为 "数据源名/数据集名" 的选项集合
     */
    public SearchFormOptionsVo loadOptions(SearchFormOptionsRequest request) {
        SearchFormOptionsVo result = new SearchFormOptionsVo();
        if (request == null || isBlank(request.getReportPath()) || request.getDatasets() == null) {
            return result;
        }
        ReportDefinition reportDefinition = loadReportDefinition(request.getReportPath(), request.getMode());
        if (reportDefinition == null) {
            return result;
        }
        for (DatasetRef ref : request.getDatasets()) {
            String key = ref.getDatasourceName() + "/" + ref.getDatasetName();
            try {
                result.putOptions(key, buildOptions(reportDefinition, ref));
            } catch (Exception e) {
                logger.warn("加载查询表单选项失败: {} - {}", key, e.getMessage());
                throw new ReportException("Search params error");
            }
        }
        return result;
    }

    /**
     * 按运行模式加载报表定义：preview 走设计器预览缓存，否则走文件渲染
     *
     * @param reportPath 报表文件路径，不可为空
     * @param mode       运行模式，可为空
     * @return 报表定义
     */
    private ReportDefinition loadReportDefinition(String reportPath, String mode) {
        reportPath = UrlParameterUtils.doubleDecode(reportPath);
        if (ReportConstants.MODE_KEY.equals(mode)) {
            return reportDefinitionService.getReportDefinition(reportPath);
        }
        return reportRender.getReportDefinition(reportPath);
    }

    /**
     * 执行单个数据集并映射为 label/value 选项
     *
     * @param reportDefinition 报表定义，不可为空
     * @param ref              数据集引用，不可为空
     * @return 选项列表
     */
    private List<Option> buildOptions(ReportDefinition reportDefinition,
                                      DatasetRef ref) {
        DatasourceDefinition dsDef = findDatasource(reportDefinition, ref.getDatasourceName());
        if (dsDef == null) {
            throw new ReportComputeException("Datasource [" + ref.getDatasourceName() + "] not exist.");
        }
        DatasetDefinition datasetDef = findDataset(dsDef, ref.getDatasetName());
        if (datasetDef == null) {
            throw new ReportComputeException("Dataset [" + ref.getDatasetName() + "] not exist.");
        }
        Map<String, Object> parameters = ref.getParameters() == null ? new HashMap<>() : ref.getParameters();
        List<?> data = executeDataset(dsDef, datasetDef, parameters);
        return mapToOptions(data, ref.getLabelField(), ref.getValueField());
    }

    /**
     * 按数据源类型执行单个数据集，返回行列表
     *
     * @param dsDef      数据源定义，不可为空
     * @param datasetDef 数据集定义，不可为空
     * @param parameters 级联查询参数，可为空（空时由数据集参数默认值兜底）
     * @return 结果行列表
     */
    private List<?> executeDataset(DatasourceDefinition dsDef, DatasetDefinition datasetDef,
                                   Map<String, Object> parameters) {
        // 静态数据源：JSON content 直接反序列化，无查询参数概念
        if (dsDef instanceof StaticDatasourceDefinition) {
            JsonDatasetDefinition jsonDataset = (JsonDatasetDefinition) datasetDef;
            Dataset ds = new Dataset(jsonDataset.getName(), JsonUtils.fromJsonList(jsonDataset.getContent(), Map.class));
            return ds.getData();
        }
        // Spring Bean 数据源：反射调用方法，parameters 直接透传
        if (dsDef instanceof SpringBeanDatasourceDefinition) {
            SpringBeanDatasourceDefinition springDs = (SpringBeanDatasourceDefinition) dsDef;
            Object targetBean = applicationContext.getBean(springDs.getBeanId());
            BeanDatasetDefinition beanDef = (BeanDatasetDefinition) datasetDef;
            Dataset ds = beanDef.buildDataset(springDs.getName(), targetBean, parameters);
            return ds.getData();
        }
        // JDBC / 内置数据源均按 SQL 数据集执行，差异只在连接获取方式
        SqlDatasetDefinition sqlDataset = (SqlDatasetDefinition) datasetDef;
        Connection conn = null;
        try {
            conn = openConnection(dsDef);
            Dataset ds = sqlDataset.buildDataset(parameters, conn);
            return ds.getData();
        } finally {
            closeConnection(conn);
        }
    }

    /**
     * 获取数据库连接：优先自定义 DatasourceProvider，其次内置数据源，JDBC 数据源自建连接
     *
     * @param dsDef 数据源定义，不可为空
     * @return 数据库连接
     */
    private Connection openConnection(DatasourceDefinition dsDef) {
        String dsName = dsDef.getName();
        Collection<DatasourceProvider> providers = applicationContext.getBeansOfType(DatasourceProvider.class).values();
        for (DatasourceProvider provider : providers) {
            if (provider.getName().equals(dsName)) {
                return provider.getConnection();
            }
        }
        if (dsDef instanceof BuildinDatasourceDefinition) {
            for (BuildinDatasource datasource : Utils.getBuildinDatasources()) {
                if (datasource.name().equals(dsName)) {
                    return datasource.getConnection();
                }
            }
            throw new ReportComputeException("Buildin datasource [" + dsName + "] not exist.");
        }
        if (dsDef instanceof JdbcDatasourceDefinition) {
            JdbcDatasourceDefinition jdbcDs = (JdbcDatasourceDefinition) dsDef;
            try {
                Class.forName(jdbcDs.getDriver());
                return DriverManager.getConnection(jdbcDs.getUrl(), jdbcDs.getUsername(), jdbcDs.getPassword());
            } catch (Exception e) {
                throw new ReportComputeException(e);
            }
        }
        throw new ReportComputeException("Unsupported datasource type: " + dsDef.getClass().getName());
    }

    /**
     * 关闭数据库连接；关闭失败不影响选项返回
     *
     * @param conn 数据库连接，可为空
     */
    private void closeConnection(Connection conn) {
        if (conn == null) {
            return;
        }
        try {
            conn.close();
        } catch (Exception ignore) {
            // 连接关闭失败不影响主流程
        }
    }

    /**
     * 结果行列表映射为 label/value 选项；value 为空的行跳过，label 为空回退为 value 文本，value 统一转字符串避免前端精度丢失
     *
     * @param data       结果行列表，可为空
     * @param labelField 标签字段，可为空
     * @param valueField 值字段，可为空
     * @return 选项列表
     */
    private List<Option> mapToOptions(List<?> data, String labelField, String valueField) {
        List<Option> list = new ArrayList<>();
        if (data == null) {
            return list;
        }
        for (Object row : data) {
            if (!(row instanceof Map)) {
                continue;
            }
            Map<?, ?> map = (Map<?, ?>) row;
            Object value = valueField == null ? null : map.get(valueField);
            if (value == null) {
                continue;
            }
            Object label = labelField == null ? null : map.get(labelField);
            // value 统一转字符串：Long 型 ID 以 JSON 数字返回会在前端丢失精度
            list.add(new Option(label == null ? String.valueOf(value) : String.valueOf(label), String.valueOf(value)));
        }
        return list;
    }

    /**
     * 按名称在报表定义中查找数据源
     *
     * @param reportDefinition 报表定义，不可为空
     * @param name            数据源名
     * @return 数据源定义；未找到返回 null
     */
    private DatasourceDefinition findDatasource(ReportDefinition reportDefinition, String name) {
        List<DatasourceDefinition> datasources = reportDefinition.getDatasources();
        if (datasources == null) {
            return null;
        }
        for (DatasourceDefinition ds : datasources) {
            if (ds.getName() != null && ds.getName().equals(name)) {
                return ds;
            }
        }
        return null;
    }

    /**
     * 按名称在数据源下查找数据集
     *
     * @param dsDef 数据源定义，不可为空
     * @param name  数据集名
     * @return 数据集定义；未找到返回 null
     */
    private DatasetDefinition findDataset(DatasourceDefinition dsDef, String name) {
        List<DatasetDefinition> datasets = dsDef.getDatasets();
        if (datasets == null) {
            return null;
        }
        for (DatasetDefinition dt : datasets) {
            if (dt.getName() != null && dt.getName().equals(name)) {
                return dt;
            }
        }
        return null;
    }

    /**
     * 判断字符串是否为空白
     *
     * @param value 字符串，可为空
     * @return 为 null 或去除首尾空后为空时返回 true
     */
    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }
}
