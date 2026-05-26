package com.luck.report.web.controller.designer;

import com.luck.report.core.exception.ReportServiceException;
import com.luck.report.core.Utils;
import com.luck.report.core.build.Context;
import com.luck.report.core.definition.dataset.Field;
import com.luck.report.core.definition.datasource.BuildinDatasource;
import com.luck.report.core.definition.datasource.DataType;
import com.luck.report.core.expression.ExpressionUtils;
import com.luck.report.core.expression.model.Expression;
import com.luck.report.core.expression.model.data.ExpressionData;
import com.luck.report.core.expression.model.data.ObjectExpressionData;
import com.luck.report.core.utils.ProcedureUtils;
import com.luck.report.core.utils.SqlSecurityUtils;
import com.luck.report.web.exception.ReportDesignException;
import com.luck.report.web.sql.enums.DbType;
import com.luck.report.web.sql.DialectFactory;
import com.luck.report.web.sql.IPageDialect;
import com.luck.report.web.utils.ResponseUtils;
import org.apache.commons.beanutils.PropertyUtils;
import org.apache.commons.lang3.StringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.sql.DataSource;
import java.beans.PropertyDescriptor;
import java.io.IOException;
import java.lang.reflect.Method;
import java.sql.*;
import java.util.Date;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 数据源控制器
 */
@RestController("bean.datasourceController")
@RequestMapping("${luck-report.servletPrefix:}/datasource")
public class DatasourceController {

    private final Logger log = LoggerFactory.getLogger(getClass());

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private DialectFactory dialectFactory;

    /**
     * 加载内置数据源
     */
    @RequestMapping("/loadBuildinDatasources")
    public void loadBuildinDatasources(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<String> datasources = new ArrayList<>();
        for (BuildinDatasource datasource : Utils.getBuildinDatasources()) {
            datasources.add(datasource.name());
        }
        ResponseUtils.writeObjectToJson(resp, datasources);
    }

    /**
     * 加载Bean方法
     */
    @RequestMapping("/loadMethods")
    public void loadMethods(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String beanId = req.getParameter("beanId");
        Object obj = applicationContext.getBean(beanId);
        Class<?> clazz = obj.getClass();
        Method[] methods = clazz.getMethods();
        List<String> result = new ArrayList<>();
        for (Method method : methods) {
            Class<?>[] types = method.getParameterTypes();
            if (types.length != 3) {
                continue;
            }
            Class<?> typeClass1 = types[0];
            Class<?> typeClass2 = types[1];
            Class<?> typeClass3 = types[2];
            if (!String.class.isAssignableFrom(typeClass1)) {
                continue;
            }
            if (!String.class.isAssignableFrom(typeClass2)) {
                continue;
            }
            if (!Map.class.isAssignableFrom(typeClass3)) {
                continue;
            }
            result.add(method.getName());
        }
        ResponseUtils.writeObjectToJson(resp, result);
    }

    /**
     * 构建类字段
     */
    @RequestMapping("/buildClass")
    public void buildClass(HttpServletRequest req, HttpServletResponse resp) {
        String clazz = req.getParameter("clazz");
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
            ResponseUtils.writeObjectToJson(resp, result);
        } catch (Exception ex) {
            throw new ReportDesignException(ex);
        }
    }

    /**
     * 构建数据库表
     */
    @RequestMapping("/buildDatabaseTables")
    public void buildDatabaseTables(HttpServletRequest req, HttpServletResponse resp) throws ReportServiceException {
        Connection conn = null;
        ResultSet rs = null;
        try {
            conn = buildConnection(req);
            DatabaseMetaData metaData = conn.getMetaData();
            String url = metaData.getURL();
            String dataBaseName = conn.getCatalog();
            String schema = null;
            if (url.toLowerCase().contains("oracle")) {
                schema = metaData.getUserName();
            }
            List<Map<String, String>> tables = new ArrayList<>();
            rs = metaData.getTables(dataBaseName, schema, "%", new String[] { "TABLE", "VIEW" });
            while (rs.next()) {
                Map<String, String> table = new HashMap<>();
                table.put("name", rs.getString("TABLE_NAME"));
                table.put("type", rs.getString("TABLE_TYPE"));
                tables.add(table);
            }
            ResponseUtils.writeObjectToJson(resp, tables);
        } catch (Exception ex) {
            throw new ReportServiceException(ex);
        } finally {
            JdbcUtils.closeResultSet(rs);
            JdbcUtils.closeConnection(conn);
        }
    }

    /**
     * 构建字段
     * 区分存储过程和普通SQL，普通SQL使用分页查询避免全表扫描
     */
    @RequestMapping("/buildFields")
    public void buildFields(HttpServletRequest req, HttpServletResponse resp) {
        String sql = req.getParameter("sql");
        String parameters = req.getParameter("parameters");
        Connection conn = null;
        final List<Field> fields = new ArrayList<>();
        try {
            conn = buildConnection(req);
            Map<String, Object> map = buildParameters(parameters);
            sql = parseSql(sql, map);
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
            ResponseUtils.writeObjectToJson(resp, fields);
        } catch (Exception ex) {
            throw new ReportDesignException(ex);
        } finally {
            JdbcUtils.closeConnection(conn);
        }
    }

    /**
     * 预览数据
     */
    @RequestMapping("/previewData")
    public void previewData(HttpServletRequest req, HttpServletResponse resp) throws ReportServiceException, IOException {
        String sql = req.getParameter("sql");
        String parameters = req.getParameter("parameters");
        Map<String, Object> map = buildParameters(parameters);
        String originalSql = parseSql(sql, map);
        // SQL安全验证：仅允许SELECT查询语句或存储过程调用
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
            // 统计数据
            DataSource dataSource = new SingleConnectionDataSource(conn, false);
            NamedParameterJdbcTemplate jdbc = new NamedParameterJdbcTemplate(dataSource);
            boolean isProcedure = ProcedureUtils.isProcedure(originalSql);
            if (dialect != null && !isProcedure) {
                String countSql = dialect.buildCountSql(originalSql);
                Integer count = jdbc.queryForObject(countSql, map, Integer.class);
                total = count != null ? count : 0;
            }
            // 查询数据
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
            ResponseUtils.writeObjectToJson(resp, result);
        } catch (Exception ex) {
            log.error("预览数据异常：{}", ex);
            throw new ReportServiceException(ex);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * 测试数据库连接
     */
    @RequestMapping("/testConnection")
    public void testConnection(HttpServletRequest req, HttpServletResponse resp) throws IOException, SQLException, ClassNotFoundException {
        String username = req.getParameter("username");
        String password = req.getParameter("password");
        String driver = req.getParameter("driver");
        String url = req.getParameter("url");
        Connection conn = null;
        Map<String, Object> map = new HashMap<>();
        try {
            Class.forName(driver);
            conn = DriverManager.getConnection(url, username, password);
            map.put("result", true);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    log.error("连接异常",e);
                }
            }
        }
        ResponseUtils.writeObjectToJson(resp, map);
    }

    // 辅助方法
    protected PreparedStatementCreator getPreparedStatementCreator(String sql, SqlParameterSource paramSource) {
        ParsedSql parsedSql = NamedParameterUtils.parseSqlStatement(sql);
        String sqlToUse = NamedParameterUtils.substituteNamedParameters(parsedSql, paramSource);
        Object[] params = NamedParameterUtils.buildValueArray(parsedSql, paramSource, null);
        List<SqlParameter> declaredParameters = NamedParameterUtils.buildSqlParameterList(parsedSql, paramSource);
        PreparedStatementCreatorFactory pscf = new PreparedStatementCreatorFactory(sqlToUse, declaredParameters);
        return pscf.newPreparedStatementCreator(params);
    }

    private String parseSql(String sql, Map<String, Object> parameters) {
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> buildParameters(String parameters) throws IOException {
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
                        if (defaultValue != null && defaultValue.equals("")) {
                            map.put(name, "");
                        } else {
                            map.put(name, "null");
                        }
                        break;
                    case List:
                        map.put(name, new ArrayList<Object>());
                        break;
                }
            } else {
                map.put(name, type.parse(defaultValue));
            }
        }
        return map;
    }

    private Connection buildConnection(HttpServletRequest req) throws Exception {
        String type = req.getParameter("type");
        if (type.equals("jdbc")) {
            String username = req.getParameter("username");
            String password = req.getParameter("password");
            String driver = req.getParameter("driver");
            String url = req.getParameter("url");

            Class.forName(driver);
            Connection conn = DriverManager.getConnection(url, username, password);
            return conn;
        } else {
            String name = req.getParameter("name");
            Connection conn = Utils.getBuildinConnection(name);
            if (conn == null) {
                throw new ReportDesignException("Buildin datasource [" + name + "] not exist.");
            }
            return conn;
        }
    }

}
