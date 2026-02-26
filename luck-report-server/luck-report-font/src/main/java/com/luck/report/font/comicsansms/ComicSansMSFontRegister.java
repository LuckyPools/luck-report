package com.luck.report.font.comicsansms;

import com.luck.report.core.export.pdf.font.FontRegister;

/**
 * @author Jacky.gao
 * @since 2014年5月7日
 */
public class ComicSansMSFontRegister implements FontRegister {

    public String getFontName() {
        return "Comic Sans MS";
    }

    public String getFontPath() {
        return "com/luck/report/font/comicsansms/COMIC.TTF";
    }
}
