package com.luck.report.web.controller.chart;

import com.luck.report.core.cache.CacheUtils;
import com.luck.report.core.chart.ChartData;
import com.luck.report.core.utils.UnitUtils;
import com.luck.report.web.controller.base.BaseController;
import com.luck.report.web.provider.RequestInfoProvider;
import com.luck.report.web.provider.ResponseInfoProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.net.URLDecoder;


/**
 * 图表控制器
 * 替代原有的ChartServletAction，提供图表数据存储功能
 */
@RestController("bean.chartController")
@RequestMapping("${luck-report.servletPrefix}/chart")
public class ChartController extends BaseController {

    /**
     * 存储图表数据
     */
    @RequestMapping("/storeData")
    public void storeData() {
        String chartId = req.getParameter("_chartId");
        ChartData chartData = CacheUtils.getChartData(chartId);
        if (chartData == null) {
            return;
        }
        String base64Data = req.getParameter("_base64Data");
        String prefix = "data:image/png;base64,";
        if (base64Data != null) {
            if (base64Data.startsWith(prefix)) {
                base64Data = base64Data.substring(prefix.length());
            }
        }
        chartData.setBase64Data(base64Data);
        String width = req.getParameter("_width");
        String height = req.getParameter("_height");
        chartData.setHeight(UnitUtils.pixelToPoint(Integer.valueOf(height)));
        chartData.setWidth(UnitUtils.pixelToPoint(Integer.valueOf(width)));
    }

    // 辅助方法：解码
    protected String decode(String value) {
        if (value == null) {
            return value;
        }
        try {
            value = URLDecoder.decode(value, "utf-8");
            value = URLDecoder.decode(value, "utf-8");
            return value;
        } catch (Exception ex) {
            return value;
        }
    }


}
