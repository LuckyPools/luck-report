package com.luck.report.font.kaiti;

import com.luck.report.core.export.pdf.font.FontRegister;

/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class KaiTiFontRegister implements FontRegister {

    public String getFontName() {
        return "楷体";
    }

    public String getFontPath() {
        return "com/luck/report/font/kaiti/SIMKAI.TTF";
    }
}
