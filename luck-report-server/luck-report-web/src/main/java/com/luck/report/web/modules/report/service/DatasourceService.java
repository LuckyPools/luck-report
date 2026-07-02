package com.luck.report.web.modules.report.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.luck.report.core.Utils;
import com.luck.report.core.build.Context;
import com.luck.report.core.definition.dataset.Field;
import com.luck.report.core.definition.datasource.BuildinDatasource;
import com.luck.report.core.definition.datasource.DataType;
import com.luck.report.core.exception.ReportServiceException;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.sql.DialectFactory;
import com.luck.report.core.sql.IPageDialect;
import com.luck.report.core.sql.enums.DbType;
import com.luck.report.core.utils.ProcedureUtils;
import com.luck.report.core.utils.SqlSecurityUtils;
import com.luck.report.web.modules.report.domain.vo.dataset.DataResult;
import com.luck.report.web.modules.report.domain.vo.request.BuildDatabaseTablesRequest;
import com.luck.report.web.modules.report.domain.vo.request.BuildFieldsRequest;
import com.luck.report.web.modules.report.domain.vo.request.JdbcConnectionRequest;
import com.luck.report.web.modules.report.domain.vo.request.PreviewDataRequest;
import com.luck.report.web.modules.report.domain.vo.request.TestConnectionRequest;
import com.luck.report.web.exception.ReportDesignException;
import org.apache.commons.beanutils.PropertyUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.PreparedStatementCallback;
import org.springframework.jdbc.core.PreparedStatementCreator;
import org.springframework.jdbc.core.PreparedStatementCreatorFactory;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.support.JdbcUtils;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.beans.PropertyDescriptor;
import java.io.IOException;
import java.lang.reflect.Method;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 数据源服务，负责数据源相关的所有业务逻辑：
 * 内置数据源加载、Bean 方法发现、数据库表 / 字段构建、SQL 预览、连接测试等。
 * <p>Bean 名：{@code bean.datasourceService}，避免与第三方系统 Bean 冲突。
 *
 * @author luck-report
 * @since 1.0.0
 */
@Service("bean.dbService")
public class DatasourceService {

    private final Logger log = LoggerFactory.getLogger(DatasourceService.class);

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private DialectFactory dialectFactory;

    /**
     * 加载所有内置数据源名称。
     */
    public List<String> loadBuildinDatasources() {
        List<String> datasources = new ArrayList<>();
        for (BuildinDatasource datasource : Utils.getBuildinDatasources()) {
            datasources.add(datasource.name());
        }
        return datasources;
    }

    /**
     * 加载 Spring 容器中指定 Bean 的"三参方法"列表（String, String, Map）。
     */
    public List<String> loadMethods(String beanId) {
        Object obj = applicationContext.getBean(beanId);
        Class<?> clazz = obj.getClass();
        Method[] methods = clazz.getMethods();
        List<String> result = new ArrayList<>();
        for (Method method : methods) {
            Class<?>[] types = method.getParameterTypes();
            if (types.length != 3) {
                continue;
            }
            if (!String.class.isAssignableFrom(types[0])) {
                continue;
            }
            if (!String.class.isAssignableFrom(types[1])) {
                continue;
            }
            if (!Map.class.isAssignableFrom(types[2])) {
                continue;
            }
            result.add(method.getName());
        }
        return result;
    }

    /**
     * 构建类的字段列表（基于 Bean 属性描述器）。
     */
    public List<Field> buildClass(String clazz) {
        List<Field> result = new ArrayList<>();
        try {
            Class<?> targetClass = Class.forName(clazz);
            PropertyDescriptor[] propertyDescriptors = PropertyUtils.getPropertyDescriptors(targetClass);
            for (PropertyDescriptor pd : propertyDescriptors) {
                String name = pd.getName();
                if ("class".equals(name)) {
                    continue;
                }
                result.add(new Field(name));
            }
            return result;
        } catch (Exception ex) {
            throw new ReportDesignException(ex);
        }
    }

    /**
     * 构建数据库表 / 视图列表。
     */
    public List<Map<String, String>> buildDatabaseTables(BuildDatabaseTablesRequest req) throws ReportServiceException {
        Connection conn = null;
        ResultSet rs = null;
        try {
            conn = buildConnection(req);
            DatabaseMetaData metaData = conn.getMetaData();
            String url = metaData.getURL();
            String dataBaseName = conn.getCatalog();
            String schema = null;
            if (url != null && url.toLowerCase().contains("oracle")) {
                schema = metaData.getUserName();
            }
            List<Map<String, String>> tables = new ArrayList<>();
            rs = metaData.getTables(dataBaseName, schema, "%", new String[]{"TABLE", "VIEW"});
            while (rs.next()) {
                Map<String, String> table = new HashMap<>();
                table.put("name", rs.getString("TABLE_NAME"));
                table.put("type", rs.getString("TABLE_TYPE"));
                tables.add(table);
            }
            return tables;
        } catch (Exception ex) {
            throw new ReportServiceException(ex);
        } finally {
            JdbcUtils.closeResultSet(rs);
            JdbcUtils.closeConnection(conn);
        }
    }

    /**
     * 构建 SQL 的字段列表。区分存储过程与普通 SQL，普通 SQL 使用分页查询避免全表扫描。
     */
    public List<Field> buildFields(BuildFieldsRequest req) {
        Connection conn = null;
        final List<Field> fields = new ArrayList<>();
        try {
            conn = buildConnection(req);
            Map<String, Object> map = buildParameters(req.getParameters());
            String sql = parseSql(req.getSql(), map);
            if (ProcedureUtils.isProcedure(sql)) {
                List<Field> fieldsList = ProcedureUtils.procedureColumnsQuery(sql, map, conn);
                fields.addAll(fieldsList);
            } else {
                SqlSecurityUtils.validate(sql);
                DataSource dataSource = new SingleConnectionDataSource(conn, false);
                NamedParameterJdbcTemplate jdbc = new NamedParameterJdbcTemplate(dataSource);
                DatabaseMetaData metaData = conn.getMetaData();
                String dbProductName = metaData.getDatabaseProductName();
                DbType dbType = DbType.getDbType(dbProductName);
                IPageDialect dialect = dialectFactory.getDialect(dbType);
                String paginationSql = sql;
                if (dialect != null) {
                    paginationSql = dialect.buildPaginationSql(sql, 0, 1);
                }
                PreparedStatementCreator statementCreator = getPreparedStatementCreator(paginationSql, new MapSqlParameterSource(map));
                jdbc.getJdbcOperations().execute(statementCreator, new PreparedStatementCallback<Object>() {
                    @Override
                    public Object doInPreparedStatement(PreparedStatement ps) throws SQLException, DataAccessException {
                        ResultSet rs = null;
                        try {
                            rs = ps.executeQuery();
                            ResultSetMetaData metadata = rs.getMetaData();
                            int columnCount = metadata.getColumnCount();
                            for (int i = 0; i < columnCount; i++) {
                                String columnName = metadata.getColumnLabel(i + 1);
                                fields.add(new Field(columnName));
                            }
                            return null;
                        } finally {
                            JdbcUtils.closeResultSet(rs);
                        }
                    }
                });
            }
            return fields;
        } catch (Exception ex) {
            throw new ReportDesignException(ex);
        } finally {
            JdbcUtils.closeConnection(conn);
        }
    }

    /**
     * 预览 SQL 数据。
     */
    public DataResult previewData(PreviewDataRequest req) throws ReportServiceException, IOException {
        Map<String, Object> map = buildParameters(req.getParameters());
        String originalSql = parseSql(req.getSql(), map);
        SqlSecurityUtils.validate(originalSql);
        Connection conn = null;
        try {
            conn = buildConnection(req);
            DatabaseMetaData metaData = conn.getMetaData();
            String dbProductName = metaData.getDatabaseProductName();
            DbType dbType = DbType.getDbType(dbProductName);
            IPageDialect dialect = dialectFactory.getDialect(dbType);
            long offset = 0;
            long limit = 15;
            int total = 0;
            DataSource dataSource = new SingleConnectionDataSource(conn, false);
            NamedParameterJdbcTemplate jdbc = new NamedParameterJdbcTemplate(dataSource);
            boolean isProcedure = ProcedureUtils.isProcedure(originalSql);
            if (dialect != null && !isProcedure) {
                String countSql = dialect.buildCountSql(originalSql);
                Integer count = jdbc.queryForObject(countSql, map, Integer.class);
                total = count != null ? count : 0;
            }
            List<Map<String, Object>> list;
            if (isProcedure) {
                list = ProcedureUtils.procedureQuery(originalSql, map, conn);
                total = list.size();
            } else {
                String paginationSql = originalSql;
                if (dialect != null) {
                    paginationSql = dialect.buildPaginationSql(originalSql, offset, limit);
                }
                list = jdbc.queryForList(paginationSql, map);
            }
            int currentTotal = list.size();
            if (currentTotal > limit) {
                currentTotal = (int) limit;
            }
            List<Map<String, Object>> dataList = new ArrayList<>();
            for (int i = 0; i < currentTotal; i++) {
                dataList.add(list.get(i));
            }
            DataResult result = new DataResult();
            List<String> fields = new ArrayList<>();
            if (currentTotal > 0) {
                Map<String, Object> item = list.get(0);
                fields.addAll(item.keySet());
            }
            result.setFields(fields);
            result.setCurrentTotal(currentTotal);
            result.setData(dataList);
            result.setTotal(total);
            return result;
        } catch (Exception ex) {
            log.error("Preview Data Exception：{}", ex);
            throw new ReportServiceException(ex);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    log.error("Close connection exception", e);
                }
            }
        }
    }

    /**
     * 测试数据库连接是否可用。
     * 连接失败时抛出 RuntimeException，由全局异常处理器统一处理。
     */
    public Map<String, Object> testConnection(TestConnectionRequest req) {
        Connection conn = null;
        Map<String, Object> map = new HashMap<>();
        try {
            Class.forName(req.getDriver());
            conn = DriverManager.getConnection(req.getUrl(), req.getUsername(), req.getPassword());
            map.put("result", true);
        } catch (Exception e) {
            log.error("Connection Exception", e);
            throw new RuntimeException("数据库连接测试失败: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    log.error("Connection close Exception", e);
                }
            }
        }
        return map;
    }

    // -------------------- 内部辅助方法 --------------------

    /**
     * 根据请求构造 PreparedStatementCreator。
     */
    public PreparedStatementCreator getPreparedStatementCreator(String sql, SqlParameterSource paramSource) {
        ParsedSql parsedSql = NamedParameterUtils.parseSqlStatement(sql);
        String sqlToUse = NamedParameterUtils.substituteNamedParameters(parsedSql, paramSource);
        Object[] params = NamedParameterUtils.buildValueArray(parsedSql, paramSource, null);
        List<SqlParameter> declaredParameters = NamedParameterUtils.buildSqlParameterList(parsedSql, paramSource);
        PreparedStatementCreatorFactory pscf = new PreparedStatementCreatorFactory(sqlToUse, declaredParameters);
        return pscf.newPreparedStatementCreator(params);
    }

    /**
     * 解析含表达式的 SQL 字符串（支持 {@code =expr=...} 与 {@code ${...}}）。
     */
    public String parseSql(String sql, Map<String, Object> parameters) {
        sql = sql.trim();
        Context context = new Context(applicationContext, parameters);
        if (sql.startsWith(ExpressionUtils.EXPR_PREFIX) && sql.endsWith(ExpressionUtils.EXPR_SUFFIX)) {
            sql = sql.substring(2, sql.length() - 1);
            Expression expr = ExpressionUtils.parseExpression(sql);
            sql = executeSqlExpr(expr, context);
            return sql;
        } else {
            String sqlForUse = sql;
            Pattern pattern = Pattern.compile("\\$\\{.*?\\}");
            Matcher matcher = pattern.matcher(sqlForUse);
            while (matcher.find()) {
                String substr = matcher.group();
                String sqlExpr = substr.substring(2, substr.length() - 1);
                Expression expr = ExpressionUtils.parseExpression(sqlExpr);
                String result = executeSqlExpr(expr, context);
                sqlForUse = sqlForUse.replace(substr, result);
            }
            Utils.logToConsole("DESIGN SQL:" + sqlForUse);
            return sqlForUse;
        }
    }

    private String executeSqlExpr(Expression sqlExpr, Context context) {
        String sqlForUse = null;
        ExpressionData<?> exprData = sqlExpr.execute(null, null, context);
        if (exprData instanceof ObjectExpressionData) {
            ObjectExpressionData data = (ObjectExpressionData) exprData;
            Object obj = data.getData();
            if (obj != null) {
                String s = obj.toString();
                s = s.replaceAll("\\\\", "");
                sqlForUse = s;
            }
        }
        return sqlForUse;
    }

    /**
     * 解析前端传入的 parameters 字符串为 Map。
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> buildParameters(String parameters) throws IOException {
        Map<String, Object> map = new HashMap<>();
        if (StringUtils.isBlank(parameters)) {
            return map;
        }
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, Object>> list = mapper.readValue(parameters, ArrayList.class);
        for (Map<String, Object> param : list) {
            String name = param.get("name").toString();
            DataType type = DataType.valueOf(param.get("type").toString());
            String defaultValue = (String) param.get("defaultValue");
            if (defaultValue == null || defaultValue.equals("")) {
                switch (type) {
                    case Boolean:
                        map.put(name, false);
                        break;
                    case Date:
                        map.put(name, new Date());
                        break;
                    case Float:
                        map.put(name, new Float(0));
                        break;
                    case Integer:
                        map.put(name, 0);
                        break;
                    case String:
                        map.put(name, "");
                        break;
                    case List:
                        map.put(name, new ArrayList<Object>());
                        break;
                    default:
                        break;
                }
            } else {
                map.put(name, type.parse(defaultValue));
            }
        }
        return map;
    }

    /**
     * 根据请求构建 JDBC 连接。
     */
    public Connection buildConnection(JdbcConnectionRequest req) throws Exception {
        String type = req.getType();
        if ("jdbc".equals(type)) {
            Class.forName(req.getDriver());
            return DriverManager.getConnection(req.getUrl(), req.getUsername(), req.getPassword());
        } else {
            String name = req.getName();
            Connection conn = Utils.getBuildinConnection(name);
            if (conn == null) {
                throw new ReportDesignException("Buildin datasource [" + name + "] not exist.");
            }
            return conn;
        }
    }
}
