package com.luck.report.font.config;

import com.luck.report.font.fangsong.FangSongFontRegister;
import com.luck.report.font.heiti.HeiTiFontRegister;
import com.luck.report.font.kaiti.KaiTiFontRegister;
import com.luck.report.font.songti.SongTiFontRegister;
import com.luck.report.font.yahei.YaheiFontRegister;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 中文字体配置类
 */
@Configuration
public class ChineseFontConfig {

    @Bean("luck-report.fangSongFontRegister")
    public FangSongFontRegister fangSongFontRegister() {
        return new FangSongFontRegister();
    }

    @Bean("luck-report.heiTiFontRegister")
    public HeiTiFontRegister heiTiFontRegister() {
        return new HeiTiFontRegister();
    }

    @Bean("luck-report.kaiTiFontRegister")
    public KaiTiFontRegister kaiTiFontRegister() {
        return new KaiTiFontRegister();
    }

    @Bean("luck-report.songTiFontRegister")
    public SongTiFontRegister songTiFontRegister() {
        return new SongTiFontRegister();
    }

    @Bean("luck-report.yaheiFontRegister")
    public YaheiFontRegister yaheiFontRegister() {
        return new YaheiFontRegister();
    }
}
