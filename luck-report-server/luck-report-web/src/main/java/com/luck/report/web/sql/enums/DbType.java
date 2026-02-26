package com.luck.report.web.sql.enums;

public enum DbType {
    MYSQL("mysql", "MySql数据库"),
    MARIADB("mariadb", "MariaDB数据库"),
    ORACLE("oracle", "Oracle11g及以下数据库(高版本推荐使用ORACLE_NEW)"),
    ORACLE_12C("oracle12c", "Oracle12c+数据库"),
    DB2("db2", "DB2数据库"),
    H2("h2", "H2数据库"),
    HSQL("hsql", "HSQL数据库"),
    SQLITE("sqlite", "SQLite数据库"),
    POSTGRE_SQL("postgresql", "Postgre数据库"),
    SQL_SERVER2005("sqlserver2005", "SQLServer2005数据库"),
    SQL_SERVER("sqlserver", "SQLServer数据库"),
    DM("dm", "达梦数据库"),
    XU_GU("xugu", "虚谷数据库"),
    KINGBASE_ES("kingbasees", "人大金仓数据库"),
    PHOENIX("phoenix", "Phoenix HBase数据库"),
    GAUSS("zenith", "Gauss 数据库"),
    CLICK_HOUSE("clickhouse", "clickhouse 数据库"),
    GBASE("gbase", "南大通用(华库)数据库"),
    GBASE_8S("gbase-8s", "南大通用数据库 GBase 8s"),
    /** @deprecated */
    @Deprecated
    GBASEDBT("gbasedbt", "南大通用数据库"),
    /** @deprecated */
    @Deprecated
    GBASE_INFORMIX("gbase 8s", "南大通用数据库 GBase 8s"),
    OSCAR("oscar", "神通数据库"),
    SYBASE("sybase", "Sybase ASE 数据库"),
    OCEAN_BASE("oceanbase", "OceanBase 数据库"),
    FIREBIRD("Firebird", "Firebird 数据库"),
    HIGH_GO("highgo", "瀚高数据库"),
    CUBRID("cubrid", "CUBRID数据库"),
    GOLDILOCKS("goldilocks", "GOLDILOCKS数据库"),
    CSIIDB("csiidb", "CSIIDB数据库"),
    SAP_HANA("hana", "SAP_HANA数据库"),
    IMPALA("impala", "impala数据库"),
    VERTICA("vertica", "vertica数据库"),
    XCloud("xcloud", "行云数据库"),
    OTHER("other", "其他数据库");

    private final String db;
    private final String desc;

    public static DbType getDbType(String dbType) {
        DbType[] var1 = values();
        int var2 = var1.length;

        for(int var3 = 0; var3 < var2; ++var3) {
            DbType type = var1[var3];
            if (type.db.equalsIgnoreCase(dbType)) {
                return type;
            }
        }

        return OTHER;
    }

    public String getDb() {
        return this.db;
    }

    public String getDesc() {
        return this.desc;
    }

    private DbType(final String db, final String desc) {
        this.db = db;
        this.desc = desc;
    }
}
