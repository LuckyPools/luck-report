package com.luck.report.web.modules.report.controller.designer;

import com.luck.report.common.domain.vo.PageResultVO;
import com.luck.report.common.domain.vo.ResultVO;
import com.luck.report.core.expression.ErrorInfo;
import com.luck.report.core.provider.report.ReportFile;
import com.luck.report.web.modules.report.domain.dto.ReportQueryDTO;
import com.luck.report.web.modules.report.domain.vo.report.ReportDefinitionVo;
import com.luck.report.web.modules.report.domain.vo.report.ReportProviderDetailVo;
import com.luck.report.web.modules.report.domain.vo.report.ReportProviderVo;
import com.luck.report.web.modules.report.service.DesignerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import javax.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * 报表设计器控制器
 * <p>仅负责 HTTP 请求 / 响应转换，所有业务逻辑委托给 {@link DesignerService}。
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
    public ResultVO<List<ErrorInfo>> scriptValidation(@RequestParam("content") String content) {
        return ResultVO.success(designerService.scriptValidation(content));
    }

    /**
     * 条件脚本验证
     */
    @RequestMapping("/conditionScriptValidation")
    @ResponseBody
    public ResultVO<List<ErrorInfo>> conditionScriptValidation(@RequestParam("content") String content) {
        return ResultVO.success(designerService.conditionScriptValidation(content));
    }

    /**
     * 解析数据集名称
     */
    @RequestMapping("/parseDatasetName")
    @ResponseBody
    public ResultVO<Map<String, String>> parseDatasetName(@RequestParam("expr") String expr) {
        Map<String, String> result = new java.util.HashMap<>(2);
        result.put("datasetName", designerService.parseDatasetName(expr));
        return ResultVO.success(result);
    }

    /**
     * 保存预览文件
     * - filePath: 报表唯一路径（如 file:xxx.ureport.xml / db:123），作为 ReportScopedCache 的 key
     * - content: 报表 XML 内容
     */
    @RequestMapping("/savePreviewFile")
    @ResponseBody
    public ResultVO<Void> savePreviewFile(@RequestParam("filePath") String filePath,
                                          @RequestParam("content") String content) throws IOException {
        designerService.savePreviewFile(filePath, content);
        return ResultVO.success();
    }

    /**
     * 加载报表
     */
    @RequestMapping(value = "/loadReport")
    @ResponseBody
    public ResultVO<ReportDefinitionVo> loadReport(@RequestParam("filePath") String filePath) {
        return ResultVO.success(designerService.loadReport(filePath));
    }

    /**
     * 删除报表文件
     */
    @RequestMapping("/deleteReportFile")
    @ResponseBody
    public ResultVO<Void> deleteReportFile(@RequestParam("filePath") String filePath) {
        designerService.deleteReportFile(filePath);
        return ResultVO.success();
    }

    /**
     * 保存报表文件
     * - title: 报表展示名（db: provider 用作 title，file: provider 忽略）
     * - filePath: 报表唯一路径（带 provider 前缀），如 file:xxx.ureport.xml / db:123
     * - content: 报表 XML 内容
     *
     * 兼容旧版：仅传 file 时，title 缺省为空字符串
     */
    @RequestMapping("/saveReportFile")
    @ResponseBody
    public ResultVO<Void> saveReportFile(@RequestParam(value = "title", required = false) String title,
                                         @RequestParam("filePath") String filePath,
                                         @RequestParam("content") String content) {
        designerService.saveReportFile(title, filePath, content);
        return ResultVO.success();
    }

    /**
     * 加载所有已启用的报表提供者元数据列表。
     * <p>仅返回 provider 基础信息（name/prefix/disabled），不包含任何文件。
     * 用于：管理页下拉、报表来源过滤等"仅需 provider 元数据"的场景。
     */
    @RequestMapping("/loadReportProviders")
    @ResponseBody
    public ResultVO<List<ReportProviderVo>> loadReportProviders() {
        return ResultVO.success(designerService.listReportProviders());
    }

    /**
     * 分页查询报表列表
     * <p>用于设计器的"打开报表"弹窗、"另存为"弹窗等需要分页加载报表的场景。
     */
    @PostMapping("/queryReports")
    @ResponseBody
    public PageResultVO<ReportFile> queryReports(@Valid @RequestBody ReportQueryDTO queryDTO) {
        return designerService.queryReports(queryDTO);
    }

    /**
     * 加载每个 provider 在指定路径下的报表文件列表（含目录）。
     * <p>响应结构：{@code List<ReportProviderDetailVo>}，与 {@link #loadReportProviders()} 形式一致；
     * 前端按 {@code vo.prefix} 识别 provider。
     * 用于：设计器的"打开报表"弹窗、"另存为"弹窗等需要展示文件树的场景。
     */
    @RequestMapping("/loadReportFiles")
    @ResponseBody
    public ResultVO<List<ReportProviderDetailVo>> loadReportFiles(@RequestParam("path") String path) {
        return ResultVO.success(designerService.loadReportFiles(path));
    }

    /**
     * 新建报表
     * - 接收 fileName（报表名，含 .ureport.xml 后缀）与 provider（报表来源前缀，例如 file:）
     * - 使用 classpath:template/template.ureport.xml 空白模板在指定 provider 下创建报表
     * - 完整文件路径 = provider + fileName（例如 file:xxx.ureport.xml）
     */
    @RequestMapping("/createReport")
    @ResponseBody
    public ResultVO<ReportFile> createReport(@RequestParam("fileName") String fileName,
                                             @RequestParam("provider") String providerPrefix) {
        return designerService.createReport(fileName, providerPrefix);
    }

    /**
     * 复制报表
     * - sourceFilePath: 源报表完整路径（带 provider 前缀），如 file:xxx.ureport.xml / db:123
     * - newFilePath: 新报表完整路径（带 provider 前缀），如 file:xxx_copy.ureport.xml / db:xxx_copy
     * - newTitle: 新报表展示名（db: provider 用作 title）
     *
     * 注意：newFilePath 必须与 sourceFilePath 属于同一 provider。
     */
    @RequestMapping("/copyReport")
    @ResponseBody
    public ResultVO<ReportFile> copyReport(@RequestParam("sourceFilePath") String sourceFilePath,
                                          @RequestParam("newFilePath") String newFilePath,
                                          @RequestParam(value = "newTitle", required = false) String newTitle) {
        return designerService.copyReport(sourceFilePath, newFilePath, newTitle);
    }
}
