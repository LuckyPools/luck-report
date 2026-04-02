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

    @Bean("bean.fangSongFontRegister")
    public FangSongFontRegister fangSongFontRegister() {
        return new FangSongFontRegister();
    }

    @Bean("bean.heiTiFontRegister")
    public HeiTiFontRegister heiTiFontRegister() {
        return new HeiTiFontRegister();
    }

    @Bean("bean.kaiTiFontRegister")
    public KaiTiFontRegister kaiTiFontRegister() {
        return new KaiTiFontRegister();
    }

    @Bean("bean.songTiFontRegister")
    public SongTiFontRegister songTiFontRegister() {
        return new SongTiFontRegister();
    }

    @Bean("bean.yaheiFontRegister")
    public YaheiFontRegister yaheiFontRegister() {
        return new YaheiFontRegister();
    }
}
