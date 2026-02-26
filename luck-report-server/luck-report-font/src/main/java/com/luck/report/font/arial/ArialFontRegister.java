package com.luck.report.font.arial;

import com.luck.report.core.export.pdf.font.FontRegister;


/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class ArialFontRegister implements FontRegister {

    public String getFontName() {
        return "Arial";
    }

    public String getFontPath() {
        return "com/luck/report/font/arial/ARIAL.TTF";
    }
}
