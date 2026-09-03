package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.DatasetOption;
import com.luck.report.core.definition.searchform.Option;
import com.luck.report.core.definition.searchform.RenderContext;

import java.util.List;

public class RadioGroupComponent extends BaseInputComponent {
    private static final long serialVersionUID = 1L;
    private List<Option> options;
    private String optionType;
    private boolean border;
    private String size;
    private String defaultValue;
    private String optionSource;
    private DatasetOption datasetOption;

    /**
     * 默认无参构造器
     */
    public RadioGroupComponent() {}

    @Override
    public String initJs(RenderContext context) {
        return "";
    }

    public String getOptionType() {
        return optionType;
    }

    public void setOptionType(String optionType) {
        this.optionType = optionType;
    }

    public boolean isBorder() {
        return border;
    }

    public void setBorder(boolean border) {
        this.border = border;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public List<Option> getOptions() {
        return options;
    }

    public void setOptions(List<Option> options) {
        this.options = options;
    }

    public String getDefaultValue() {
        return defaultValue;
    }

    public void setDefaultValue(String defaultValue) {
        this.defaultValue = defaultValue;
    }

    public String getOptionSource() {
        return optionSource;
    }

    public void setOptionSource(String optionSource) {
        this.optionSource = optionSource;
    }

    public DatasetOption getDatasetOption() {
        return datasetOption;
    }

    public void setDatasetOption(DatasetOption datasetOption) {
        this.datasetOption = datasetOption;
    }
}
