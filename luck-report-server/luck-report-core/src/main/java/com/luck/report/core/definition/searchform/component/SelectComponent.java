package com.luck.report.core.definition.searchform.component;

import com.luck.report.core.definition.searchform.DatasetOption;
import com.luck.report.core.definition.searchform.Option;
import com.luck.report.core.definition.searchform.RenderContext;

import java.util.List;

public class SelectComponent extends BaseInputComponent {
    private static final long serialVersionUID = 1L;
    private boolean multiple;
    private boolean clearable;
    private boolean filterable;
    private String placeholder;
    private List<Option> options;
    private String defaultValue;
    private String optionSource;
    private DatasetOption datasetOption;

    /**
     * 默认无参构造器
     */
    public SelectComponent() {}

    @Override
    public String initJs(RenderContext context) {
        return "";
    }

    public boolean isMultiple() {
        return multiple;
    }

    public void setMultiple(boolean multiple) {
        this.multiple = multiple;
    }

    public boolean isClearable() {
        return clearable;
    }

    public void setClearable(boolean clearable) {
        this.clearable = clearable;
    }

    public boolean isFilterable() {
        return filterable;
    }

    public void setFilterable(boolean filterable) {
        this.filterable = filterable;
    }

    public String getPlaceholder() {
        return placeholder;
    }

    public void setPlaceholder(String placeholder) {
        this.placeholder = placeholder;
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
