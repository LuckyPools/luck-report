package com.luck.report.agent.config;

import com.luck.report.core.sql.DialectFactory;
import com.luck.report.core.sql.IPageDialect;
import com.luck.report.core.sql.enums.DbType;
import com.luck.report.core.Utils;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Properties;

/**
 * MyBatis 分页拦截器
 * 拦截查询方法，当参数中包含 offset 和 pageSize 时，
 * 自动根据当前数据源的数据库类型调用 DialectFactory 改写分页 SQL，
 * 抹除不同数据库的分页语法差异（MySQL LIMIT / Oracle ROWNUM / SQL Server ROW_NUMBER 等）
 *
 * 使用方式：Mapper 方法参数中传入 offset 和 pageSize 即可触发自动分页，
 * SQL 中无需手写 LIMIT/OFFSET 等数据库特有的分页语句
 *
 * @author luck
 */
@Intercepts({
        @Signature(type = Executor.class, method = "query",
                args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class PaginationInterceptor implements Interceptor {

    private static final Logger log = LoggerFactory.getLogger(PaginationInterceptor.class);

    /**
     * 拦截查询方法，自动追加分页语句
     * 当参数中包含 offset(Integer) 和 pageSize(Integer) 参数时，
     * 通过 DialectFactory 获取当前数据库类型的方言实现，自动改写 SQL
     *
     * @param invocation MyBatis 拦截点信息
     * @return 查询结果
     * @throws Throwable 执行异常
     */
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        Object parameter = args[1];

        // 仅拦截 SELECT 语句
        if (ms.getSqlCommandType() != SqlCommandType.SELECT) {
            return invocation.proceed();
        }

        // 从参数中提取 offset 和 pageSize
        Integer offset = null;
        Integer pageSize = null;

        if (parameter instanceof Map) {
            Map<?, ?> paramMap = (Map<?, ?>) parameter;
            offset = getIntegerParam(paramMap, "offset");
            pageSize = getIntegerParam(paramMap, "pageSize");
        }

        // 没有分页参数，直接执行
        if (offset == null || pageSize == null) {
            return invocation.proceed();
        }

        // 获取当前数据源的数据库类型
        String databaseId = ms.getConfiguration().getDatabaseId();
        DbType dbType = resolveDbType(databaseId);
        if (dbType == null || dbType == DbType.OTHER) {
            // 无法识别数据库类型，降级使用 MySQL 方言
            log.warn("无法识别数据库类型 databaseId={}，降级使用 MySQL 分页方言", databaseId);
            dbType = DbType.MYSQL;
        }

        // 通过 DialectFactory 获取方言实现并改写 SQL
        DialectFactory dialectFactory = getDialectFactory();
        IPageDialect dialect = dialectFactory.getDialect(dbType);
        if (dialect == null) {
            log.warn("未找到数据库类型 {} 的分页方言实现，降级使用 MySQL", dbType);
            dialect = dialectFactory.getDialect(DbType.MYSQL);
        }

        if (dialect != null) {
            String originalSql = ms.getBoundSql(parameter).getSql();
            String paginationSql = dialect.buildPaginationSql(originalSql, offset, pageSize);
            // 通过反射修改 BoundSql 中的 sql 字段
            org.apache.ibatis.mapping.BoundSql boundSql = ms.getBoundSql(parameter);
            try {
                java.lang.reflect.Field field = boundSql.getClass().getDeclaredField("sql");
                field.setAccessible(true);
                field.set(boundSql, paginationSql);
            } catch (Exception e) {
                log.error("修改分页SQL失败", e);
            }
        }

        return invocation.proceed();
    }

    /**
     * 从参数 Map 中提取 Integer 值
     * 兼容参数名为 offset/pageSize 的各种类型（Integer、int、Long 等）
     *
     * @param paramMap 参数 Map
     * @param key      参数名
     * @return Integer 值，不存在或类型不匹配返回 null
     */
    private Integer getIntegerParam(Map<?, ?> paramMap, String key) {
        // ParamMap.get() 在 key 不存在时会抛 BindingException，必须先判断 containsKey
        if (!paramMap.containsKey(key)) {
            return null;
        }
        Object value = paramMap.get(key);
        if (value == null) {
            return null;
        }
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    /**
     * 根据 MyBatis 的 databaseId 解析为 DbType 枚举
     *
     * @param databaseId MyBatis 识别的数据库标识
     * @return DbType 枚举值
     */
    private DbType resolveDbType(String databaseId) {
        if (databaseId == null) {
            return null;
        }
        return DbType.getDbType(databaseId);
    }

    /**
     * 获取 DialectFactory 实例
     * 通过 Utils.getApplicationContext() 从 Spring 容器获取，避免拦截器实例化时容器未就绪
     *
     * @return DialectFactory 实例
     */
    private DialectFactory getDialectFactory() {
        return Utils.getApplicationContext().getBean(DialectFactory.class);
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // 无需额外配置
    }
}
