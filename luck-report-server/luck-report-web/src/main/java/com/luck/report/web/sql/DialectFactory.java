package com.luck.report.web.sql;

import com.luck.report.web.sql.enums.DbType;

import java.util.HashMap;
import java.util.Map;

public class DialectFactory {

    private static final Map<DbType, IPageDialect> dialectMap = new HashMap<>();

    static {
        dialectMap.put(DbType.MYSQL, new MySqlDialect());
        dialectMap.put(DbType.MARIADB, new MySqlDialect());
        dialectMap.put(DbType.ORACLE, new OracleDialect());
        dialectMap.put(DbType.ORACLE_12C, new OracleDialect());
        dialectMap.put(DbType.SQL_SERVER, new SQLServerDialect());
        dialectMap.put(DbType.SQL_SERVER2005, new SQLServerDialect());
        dialectMap.put(DbType.DM, new DamengDialect());
    }

    public static IPageDialect getDialect(String dbType) {
        DbType type = DbType.getDbType(dbType);
        return dialectMap.get(type);
    }

    public static IPageDialect getDialect(DbType dbType) {
        return dialectMap.get(dbType);
    }
}
