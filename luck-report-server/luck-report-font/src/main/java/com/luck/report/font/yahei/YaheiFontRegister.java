package com.luck.report.font.yahei;

import com.luck.report.core.export.pdf.font.FontRegister;

/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class YaheiFontRegister implements FontRegister {

    public String getFontName() {
        return "微软雅黑";
    }

    public String getFontPath() {
        return "com/luck/report/font/yahei/msyh.ttc";
    }
}
