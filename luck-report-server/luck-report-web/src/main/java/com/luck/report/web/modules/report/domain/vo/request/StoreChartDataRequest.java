package com.luck.report.web.modules.report.domain.vo.request;

/**
 * 图表数据存储请求 VO。
 * <p>
 * 用于 {@code /chart/storeData} 接口，前端在图表渲染完成后将 base64 图片数据回传至后端。
 * <p>前端表单字段名带下划线前缀（{@code _chartId} 等），setter 与字段名保持一致以兼容 form 表单绑定。
 *
 * @author luck-report
 * @since 1.0.0
 */
public class StoreChartDataRequest {

    /**
     * 图表唯一标识。
     */
    private String _chartId;

    /**
     * 图表 base64 编码数据（可能带 {@code data:image/png;base64,} 前缀，后端会去除）。
     */
    private String _base64Data;

    /**
     * 图表宽度（像素），后端会转换为 Point 单位。
     */
    private Integer _width;

    /**
     * 图表高度（像素），后端会转换为 Point 单位。
     */
    private Integer _height;

    /**
     * 报表文件路径（前端从 URL 参数传递）。
     */
    private String filePath;

    /**
     * 预览模式标识（前端从 URL 参数传递）。
     */
    private String _m;

    public StoreChartDataRequest() {
    }

    public StoreChartDataRequest(String _chartId, String _base64Data, Integer _width, Integer _height) {
        this._chartId = _chartId;
        this._base64Data = _base64Data;
        this._width = _width;
        this._height = _height;
    }

    public String get_chartId() {
        return _chartId;
    }

    public void set_chartId(String _chartId) {
        this._chartId = _chartId;
    }

    public String get_base64Data() {
        return _base64Data;
    }

    public void set_base64Data(String _base64Data) {
        this._base64Data = _base64Data;
    }

    public Integer get_width() {
        return _width;
    }

    public void set_width(Integer _width) {
        this._width = _width;
    }

    public Integer get_height() {
        return _height;
    }

    public void set_height(Integer _height) {
        this._height = _height;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String get_m() {
        return _m;
    }

    public void set_m(String _m) {
        this._m = _m;
    }
}
