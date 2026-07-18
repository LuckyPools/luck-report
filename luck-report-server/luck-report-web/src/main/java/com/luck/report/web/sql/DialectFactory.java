package com.luck.report.web.sql;

import com.luck.report.core.Utils;
import com.luck.report.core.cache.CacheUtils;
import com.luck.report.core.cache.ReportCache;
import com.luck.report.core.exception.ReportException;
import com.luck.report.web.sql.enums.DbType;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

/**
 * 数据库方言工厂
 * 通过Spring容器自动获取所有IPageDialect实现类
 * 支持业务系统自定义注入方言实现
 */
@Component
public class DialectFactory {

    private final Map<DbType, IPageDialect> dialectMap = new HashMap<>();

    /**
     * 获取方言 Map
     * 从Spring容器中获取所有IPageDialect实现类，并按数据库类型存入Map
     */
    public Map<DbType, IPageDialect> getDialectMap() {
        if (dialectMap.isEmpty()) {
            synchronized (DialectFactory.class) {
                if (dialectMap.isEmpty()) {
                    Collection<IPageDialect> services = Utils.getApplicationContext().getBeansOfType(IPageDialect.class).values();
                    for (IPageDialect dialect : services) {
                        dialectMap.put(dialect.getDbType(), dialect);
                    }
                }
            }
        }
        return dialectMap;
    }

    /**
     * 根据数据库类型字符串获取对应的方言实现
     *
     * @param type 数据库类型字符串，不能为空
     * @return 对应的方言实现，可能为null
     */
    public IPageDialect getDialect(String type) {
        DbType dbType = DbType.getDbType(type);
        return getDialect(dbType);
    }

    /**
     * 根据数据库类型枚举获取对应的方言实现
     *
     * @param dbType 数据库类型枚举，不能为空
     * @return 对应的方言实现，可能为null
     */
    public IPageDialect getDialect(DbType dbType) {
        return getDialectMap().get(dbType);
    }
}
