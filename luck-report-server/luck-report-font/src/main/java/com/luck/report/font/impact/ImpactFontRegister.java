package com.luck.report.font.impact;

import com.luck.report.core.export.pdf.font.FontRegister;

/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class ImpactFontRegister implements FontRegister {

    public String getFontName() {
        return "Impact";
    }

    public String getFontPath() {
        return "com/luck/report/font/impact/IMPACT.TTF";
    }
}
