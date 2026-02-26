package com.luck.report.core.config;

import com.luck.report.core.parser.impl.searchform.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FormParserConfiguration {

    @Bean
    public FormParserUtils formParserUtils() {
        return new FormParserUtils();
    }

    @Bean
    public RowParser rowParser() {
        return new RowParser();
    }

    @Bean
    public ColParser colParser() {
        return new ColParser();
    }

    @Bean
    public InputParser inputParser() {
        return new InputParser();
    }

    @Bean
    public ButtonParser buttonParser() {
        return new ButtonParser();
    }

    @Bean
    public SwitchParser switchParser() {
        return new SwitchParser();
    }

    @Bean
    public SelectParser selectParser() {
        return new SelectParser();
    }

    @Bean
    public CheckboxGroupParser checkboxGroupParser() {
        return new CheckboxGroupParser();
    }

    @Bean
    public RadioGroupParser radioGroupParser() {
        return new RadioGroupParser();
    }

    @Bean
    public InputNumberParser inputNumberParser() {
        return new InputNumberParser();
    }

    @Bean
    public DatePickerParser datePickerParser() {
        return new DatePickerParser();
    }
}
