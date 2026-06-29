package com.luck.report.web.utils;
public class ReportUtils {

    /**
     * 新建报表的空白模板（位于 classpath:template/template.ureport.xml）
     */
    private static final String DEFAULT_REPORT_TEMPLATE = "template/template.ureport.xml";

    private static final String ClASS_REPORT_TEMPLATE = "classpath:" + DEFAULT_REPORT_TEMPLATE;

    public static String getDefaultTemplatePath(){
        return DEFAULT_REPORT_TEMPLATE;
    }

    public static String getClassTemplatePath(){
        return ClASS_REPORT_TEMPLATE;
    }
}
