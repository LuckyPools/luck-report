package com.luck.report.font.songti;

import com.luck.report.core.export.pdf.font.FontRegister;

/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class SongTiFontRegister implements FontRegister {

    public String getFontName() {
        return "宋体";
    }

    public String getFontPath() {
        return "com/luck/report/font/songti/SIMSUN.TTC";
    }
}
