package com.luck.report.font.config;

import com.luck.report.font.arial.ArialFontRegister;
import com.luck.report.font.comicsansms.ComicSansMSFontRegister;
import com.luck.report.font.couriernew.CourierNewFontRegister;
import com.luck.report.font.timesnewroman.TimesNewRomanFontRegister;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 英文字体配置类
 */
@Configuration
public class EnglishFontConfig {

    @Bean("luck-report.arialFontRegister")
    public ArialFontRegister arialFontRegister() {
        return new ArialFontRegister();
    }

    @Bean("luck-report.comicSansMSFontRegister")
    public ComicSansMSFontRegister comicSansMSFontRegister() {
        return new ComicSansMSFontRegister();
    }

    @Bean("luck-report.courierNewFontRegister")
    public CourierNewFontRegister courierNewFontRegister() {
        return new CourierNewFontRegister();
    }

    @Bean("luck-report.timesNewRomanFontRegister")
    public TimesNewRomanFontRegister timesNewRomanFontRegister() {
        return new TimesNewRomanFontRegister();
    }
}
