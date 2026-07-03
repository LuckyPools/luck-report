package com.luck.report.web.modules.report.controller.chart;

import com.luck.report.web.common.vo.ResultVO;
import com.luck.report.core.cache.ChartScopeCache;
import com.luck.report.core.chart.ChartData;
import com.luck.report.core.utils.UnitUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


/**
 * 图表控制器
 * 替代原有的ChartServletAction，提供图表数据存储功能
 */
@RestController("bean.chartController")
@RequestMapping("${luck-report.servletPrefix:}/chart")
public class ChartController {

    /**
     * 存储图表数据
     * 使用 @RequestParam 接收 multipart/form-data 参数
     */
    @RequestMapping("/storeData")
    public ResultVO<Void> storeData(
            @RequestParam("_chartId") String chartId,
            @RequestParam("_base64Data") String base64Data,
            @RequestParam("_width") Integer width,
            @RequestParam("_height") Integer height,
            @RequestParam(value = "filePath", required = false) String filePath,
            @RequestParam(value = "_m", required = false) String mode) {

        ChartData chartData = ChartScopeCache.getChartData(chartId);
        if (chartData == null) {
            return ResultVO.success();
        }
        String prefix = "data:image/png;base64,";
        if (base64Data != null && base64Data.startsWith(prefix)) {
            base64Data = base64Data.substring(prefix.length());
        }
        chartData.setBase64Data(base64Data);
        chartData.setHeight(UnitUtils.pixelToPoint(height));
        chartData.setWidth(UnitUtils.pixelToPoint(width));
        ChartScopeCache.putChartData(chartId, chartData);
        return ResultVO.success();
    }

}
