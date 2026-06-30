package com.luck.report.web.modules.report.controller.chart;

import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.cache.ChartScopeCache;
import com.luck.report.core.chart.ChartData;
import com.luck.report.core.utils.UnitUtils;
import com.luck.report.web.modules.report.domain.vo.request.StoreChartDataRequest;
import org.springframework.web.bind.annotation.RequestMapping;
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
     */
    @RequestMapping("/storeData")
    public ResultVO<Void> storeData(StoreChartDataRequest req) {
        ChartData chartData = ChartScopeCache.getChartData(req.get_chartId());
        if (chartData == null) {
            return ResultVO.success();
        }
        String base64Data = req.get_base64Data();
        String prefix = "data:image/png;base64,";
        if (base64Data != null) {
            if (base64Data.startsWith(prefix)) {
                base64Data = base64Data.substring(prefix.length());
            }
        }
        chartData.setBase64Data(base64Data);
        chartData.setHeight(UnitUtils.pixelToPoint(req.get_height()));
        chartData.setWidth(UnitUtils.pixelToPoint(req.get_width()));
        ChartScopeCache.putChartData(req.get_chartId(), chartData);
        return ResultVO.success();
    }

}
