package com.luck.report.font.fangsong;

import com.luck.report.core.export.pdf.font.FontRegister;

/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class FangSongFontRegister implements FontRegister {

    public String getFontName() {
        return "仿宋";
    }

    public String getFontPath() {
        return "com/luck/report/font/fangsong/SIMFANG.TTF";
    }
}
