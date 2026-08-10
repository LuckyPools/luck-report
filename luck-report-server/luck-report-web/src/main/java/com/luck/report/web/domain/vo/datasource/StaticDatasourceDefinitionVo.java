package com.luck.report.web.domain.vo.datasource;

/**
 * @author jack
 * @version 1.0
 * @description: 静态数据源vo类
 * @date 2026-08-07 16:15
 */
public class StaticDatasourceDefinitionVo extends DatasourceDefinitionVo {

    private static final long serialVersionUID = -2246425696307057210L;
    private String remark;

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
