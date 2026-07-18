package com.luck.report.web.domain.vo.dataset;

import java.util.List;
import java.util.Map;

/**
 * 数据查询结果
 */
public class DataResult {

    /** 数据行 */
    private List<Map<String, Object>> data;
    /** 字段名列表 */
    private List<String> fields;
    /** 总记录数 */
    private int total;
    /** 当前页记录数 */
    private int currentTotal;

    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }

    public List<String> getFields() {
        return fields;
    }

    public void setFields(List<String> fields) {
        this.fields = fields;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getCurrentTotal() {
        return currentTotal;
    }

    public void setCurrentTotal(int currentTotal) {
        this.currentTotal = currentTotal;
    }
}
