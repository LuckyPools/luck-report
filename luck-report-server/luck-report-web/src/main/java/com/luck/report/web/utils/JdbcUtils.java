package com.luck.report.web.utils;

import com.luck.report.web.sql.enums.DbType;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import java.util.regex.Pattern;

public class JdbcUtils {
    private static final Log logger = LogFactory.getLog(JdbcUtils.class);

    public JdbcUtils() {
    }

    public static DbType getDbType(String jdbcUrl) {
        String url = jdbcUrl.toLowerCase();
        if (!url.contains(":mysql:") && !url.contains(":cobar:")) {
            if (url.contains(":mariadb:")) {
                return DbType.MARIADB;
            } else if (url.contains(":oracle:")) {
                return DbType.ORACLE;
            } else if (!url.contains(":sqlserver:") && !url.contains(":microsoft:")) {
                if (url.contains(":sqlserver2012:")) {
                    return DbType.SQL_SERVER;
                } else if (url.contains(":postgresql:")) {
                    return DbType.POSTGRE_SQL;
                } else if (url.contains(":hsqldb:")) {
                    return DbType.HSQL;
                } else if (url.contains(":db2:")) {
                    return DbType.DB2;
                } else if (url.contains(":sqlite:")) {
                    return DbType.SQLITE;
                } else if (url.contains(":h2:")) {
                    return DbType.H2;
                } else if (regexFind(":dm:", url)) {
                    return DbType.DM;
                } else if (url.contains(":xugu:")) {
                    return DbType.XU_GU;
                } else if (regexFind(":kingbase\\d*:", url)) {
                    return DbType.KINGBASE_ES;
                } else if (url.contains(":phoenix:")) {
                    return DbType.PHOENIX;
                } else if (url.contains(":zenith:")) {
                    return DbType.GAUSS;
                } else if (url.contains(":gbase:")) {
                    return DbType.GBASE;
                } else if (!url.contains(":gbasedbt-sqli:") && !url.contains(":informix-sqli:")) {
                    if (url.contains(":clickhouse:")) {
                        return DbType.CLICK_HOUSE;
                    } else if (url.contains(":oscar:")) {
                        return DbType.OSCAR;
                    } else if (url.contains(":sybase:")) {
                        return DbType.SYBASE;
                    } else if (url.contains(":oceanbase:")) {
                        return DbType.OCEAN_BASE;
                    } else if (url.contains(":highgo:")) {
                        return DbType.HIGH_GO;
                    } else if (url.contains(":cubrid:")) {
                        return DbType.CUBRID;
                    } else if (url.contains(":goldilocks:")) {
                        return DbType.GOLDILOCKS;
                    } else if (url.contains(":csiidb:")) {
                        return DbType.CSIIDB;
                    } else if (url.contains(":sap:")) {
                        return DbType.SAP_HANA;
                    } else if (url.contains(":impala:")) {
                        return DbType.IMPALA;
                    } else if (url.contains(":vertica:")) {
                        return DbType.VERTICA;
                    } else if (url.contains(":xcloud:")) {
                        return DbType.XCloud;
                    } else if (url.contains(":firebirdsql:")) {
                        return DbType.FIREBIRD;
                    } else {
                        logger.warn("The jdbcUrl is " + jdbcUrl + ", Mybatis Plus Cannot Read Database type or The Database's Not Supported!");
                        return DbType.OTHER;
                    }
                } else {
                    return DbType.GBASE_8S;
                }
            } else {
                return DbType.SQL_SERVER2005;
            }
        } else {
            return DbType.MYSQL;
        }
    }

    public static boolean regexFind(String regex, CharSequence input) {
        return null != input && Pattern.compile(regex).matcher(input).find();
    }
}
