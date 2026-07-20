package com.luck.report.web.controller.designer;

import com.luck.report.core.expression.ErrorInfo;
import com.luck.report.web.domain.vo.report.ReportDefinitionVo;
import com.luck.report.web.provider.ResponseInfoProvider;
import com.luck.report.web.service.DesignerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * 报表设计器控制器，仅负责HTTP请求/响应转换，业务逻辑委托给DesignerService
 *
 * @author Jacky.gao
 * @since 2017年1月25日
 */
@Controller("bean.designerController")
@RequestMapping("${luck-report.servletPrefix:}/designer")
public class DesignerController {

    @Autowired
    @Qualifier("bean.designerService")
    private DesignerService designerService;

    /**
     * 脚本验证
     */
    @RequestMapping("/scriptValidation")
    @ResponseBody
    public void scriptValidation(@RequestParam("content") String content, ResponseInfoProvider resp) throws IOException {
        List<ErrorInfo> infos = designerService.scriptValidation(content);
        resp.writeObjectToJson(infos);
    }

    /**
     * 条件脚本验证
     */
    @RequestMapping("/conditionScriptValidation")
    @ResponseBody
    public void conditionScriptValidation(@RequestParam("content") String content, ResponseInfoProvider resp) throws IOException {
        List<ErrorInfo> infos = designerService.conditionScriptValidation(content);
        resp.writeObjectToJson(infos);
    }

    /**
     * 解析数据集名称
     */
    @RequestMapping("/parseDatasetName")
    @ResponseBody
    public void parseDatasetName(@RequestParam("expr") String expr, ResponseInfoProvider resp) throws IOException {
        String datasetName = designerService.parseDatasetName(expr);
        Map<String, String> result = new java.util.HashMap<>(2);
        result.put("datasetName", datasetName);
        resp.writeObjectToJson(result);
    }

    /**
     * 保存预览文件
     */
    @RequestMapping("/savePreviewFile")
    @ResponseBody
    public void savePreviewFile(@RequestParam("fileName") String fileName,
                                @RequestParam("content") String content,
                                ResponseInfoProvider resp) {
        designerService.savePreviewFile(fileName, content);
    }

    /**
     * 加载报表
     */
    @RequestMapping(value = "/loadReport")
    @ResponseBody
    public void loadReport(@RequestParam("filePath") String filePath, ResponseInfoProvider resp) throws IOException {
        ReportDefinitionVo vo = designerService.loadReport(filePath);
        resp.writeObjectToJson(vo);
    }

    /**
     * 删除报表文件
     */
    @RequestMapping("/deleteReportFile")
    @ResponseBody
    public void deleteReportFile(@RequestParam("file") String file) {
        designerService.deleteReportFile(file);
    }

    /**
     * 保存报表文件
     */
    @RequestMapping("/saveReportFile")
    @ResponseBody
    public void saveReportFile(@RequestParam("file") String file,
                               @RequestParam("content") String content) {
        designerService.saveReportFile(file, content);
    }

    /**
     * 加载报表提供者
     */
    @RequestMapping("/loadReportProviders")
    @ResponseBody
    public void loadReportProviders(@RequestParam(value = "path", required = false) String path,
                                    ResponseInfoProvider resp) throws IOException {
        Object result = designerService.loadReportProviders(path);
        resp.writeObjectToJson(result);
    }
}
