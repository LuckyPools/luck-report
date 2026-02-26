package com.luck.report.font.timesnewroman;

import com.luck.report.core.export.pdf.font.FontRegister;

/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class TimesNewRomanFontRegister implements FontRegister {

    public String getFontName() {
        return "Times New Roman";
    }

    public String getFontPath() {
        return "com/luck/report/font/timesnewroman/TIMES.TTF";
    }
}
