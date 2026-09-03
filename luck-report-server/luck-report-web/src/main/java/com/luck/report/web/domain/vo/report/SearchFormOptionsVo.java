package com.luck.report.web.domain.vo.report;

import com.luck.report.core.definition.searchform.Option;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 查询表单选项加载结果：按数据集引用执行后返回的选项集合
 *
 * @author luckyPools
 * @since 2026年08月31日
 */
public class SearchFormOptionsVo implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 选项集：key 为 "数据源名/数据集名"，value 为选项列表 */
    private Map<String, List<Option>> options = new HashMap<>();

    /** 单项加载失败的错误信息：key 为 "数据源名/数据集名"，仅失败项存在 */
    private Map<String, String> errors = new HashMap<>();

    /**
     * 默认无参构造器
     */
    public SearchFormOptionsVo() {}

    /**
     * 追加单个数据集的选项列表；list 为空时落为空列表
     *
     * @param key  数据集选项键（"数据源名/数据集名"）
     * @param list 选项列表，可为空
     */
    public void putOptions(String key, List<Option> list) {
        options.put(key, list == null ? new ArrayList<>() : list);
    }

    /**
     * 记录单个数据集的加载失败信息
     *
     * @param key     数据集选项键（"数据源名/数据集名"）
     * @param message 失败原因
     */
    public void putError(String key, String message) {
        errors.put(key, message);
    }

    public Map<String, List<Option>> getOptions() {
        return options;
    }

    public void setOptions(Map<String, List<Option>> options) {
        this.options = options;
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, String> errors) {
        this.errors = errors;
    }


}
