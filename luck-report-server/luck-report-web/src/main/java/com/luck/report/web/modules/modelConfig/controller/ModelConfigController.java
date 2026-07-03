package com.luck.report.web.modules.modelConfig.controller;

import com.luck.report.web.common.vo.PageResultVO;
import com.luck.report.web.modules.modelConfig.domain.dto.ModelConfigDTO;
import com.luck.report.web.modules.modelConfig.domain.dto.ModelConfigQueryDTO;
import com.luck.report.web.modules.modelConfig.domain.enums.ModelType;
import com.luck.report.web.modules.chat.domain.vo.ModelCheckVo;
import com.luck.report.web.common.vo.ResultVO;
import com.luck.report.web.modules.modelConfig.service.ModelConfigDataService;
import javax.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 模型配置Controller
 * 提供模型配置的管理接口,包括增删改查、激活切换、连通性测试等
 *
 * @author luck
 */
@AllArgsConstructor
@RestController("bean.modelConfigController")
@RequestMapping("${luck-report.servletPrefix:}/model-config")
public class ModelConfigController {

    private final ModelConfigDataService modelConfigDataService;

    /**
     * 获取模型配置列表
     *
     * @return ResultVO包含模型配置列表
     */
    @GetMapping("/list")
    public ResultVO<List<ModelConfigDTO>> list() {
        try {
            List<ModelConfigDTO> configs = modelConfigDataService.listConfigs();
            return ResultVO.success("获取模型配置列表成功", sanitizeList(configs));
        } catch (Exception e) {
            return ResultVO.error("获取模型配置列表失败: " + e.getMessage());
        }
    }

    /**
     * 分页查询模型配置列表
     *
     * @param queryDTO 查询条件
     * @return 分页结果
     */
    @PostMapping("/query/page")
    public PageResultVO<ModelConfigDTO> queryByPage(@Valid @RequestBody ModelConfigQueryDTO queryDTO) {
        try {
            PageResultVO<ModelConfigDTO> pageResult = modelConfigDataService.queryByPage(queryDTO);
            if (pageResult.getRecords() != null) {
                pageResult.setRecords(sanitizeList(pageResult.getRecords()));
            }
            return pageResult;
        } catch (Exception e) {
            return PageResultVO.error("分页查询失败: " + e.getMessage());
        }
    }

    /**
     * 新增模型配置
     *
     * @param config ModelConfigDTO对象
     * @return ResultVO操作结果
     */
    @PostMapping("/add")
    public ResultVO<String> add(@Valid @RequestBody ModelConfigDTO config) {
        try {
            modelConfigDataService.addConfig(config);
            return ResultVO.success("配置已保存");
        } catch (Exception e) {
            return ResultVO.error("保存失败: " + e.getMessage());
        }
    }

    /**
     * 更新模型配置
     *
     * @param config ModelConfigDTO对象
     * @return ResultVO操作结果
     */
    @PutMapping("/update")
    public ResultVO<String> update(@Valid @RequestBody ModelConfigDTO config) {
        try {
            modelConfigDataService.updateConfigInDb(config);
            return ResultVO.success("配置已更新");
        } catch (Exception e) {
            return ResultVO.error("更新失败: " + e.getMessage());
        }
    }

    /**
     * 删除模型配置
     *
     * @param id 配置ID
     * @return ResultVO操作结果
     */
    @DeleteMapping("/{id}")
    public ResultVO<String> delete(@PathVariable String id) {
        try {
            modelConfigDataService.deleteConfig(id);
            return ResultVO.success("配置已删除");
        } catch (Exception e) {
            return ResultVO.error("删除失败: " + e.getMessage());
        }
    }

    /**
     * 启用模型配置
     *
     * @param id 配置ID
     * @return ResultVO操作结果
     */
    @PostMapping("/activate/{id}")
    public ResultVO<String> activate(@PathVariable String id) {
        try {
            modelConfigDataService.activateConfig(id);
            return ResultVO.success("模型启用成功!");
        } catch (Exception e) {
            return ResultVO.error("启用失败: " + e.getMessage());
        }
    }

    /**
     * 禁用模型配置
     * 如果该类型只有一个启用的模型，则不允许禁用
     *
     * @param id 配置ID
     * @return ResultVO操作结果
     */
    @PostMapping("/deactivate/{id}")
    public ResultVO<String> deactivate(@PathVariable String id) {
        try {
            modelConfigDataService.deactivateConfig(id);
            return ResultVO.success("模型禁用成功!");
        } catch (Exception e) {
            return ResultVO.error("禁用失败: " + e.getMessage());
        }
    }

    /**
     * 根据模型类型获取所有激活的模型配置列表
     * 用于前端对话框模型选择
     *
     * @param modelType 模型类型(CHAT/EMBEDDING)
     * @return ResultVO包含激活的模型配置列表
     */
    @GetMapping("/active-list/{modelType}")
    public ResultVO<List<ModelConfigDTO>> getActiveList(@PathVariable String modelType) {
        try {
            ModelType type = ModelType.fromCode(modelType);
            if (type == null) {
                return ResultVO.error("无效的模型类型: " + modelType);
            }
            List<ModelConfigDTO> activeConfigs = modelConfigDataService.listActiveConfigsByType(type);
            // 复制后置空 apiKey，避免污染缓存对象，同时不泄露敏感信息给前端
            return ResultVO.success("获取激活模型列表成功", sanitizeList(activeConfigs));
        } catch (Exception e) {
            return ResultVO.error("获取激活模型列表失败: " + e.getMessage());
        }
    }

    /**
     * 检查模型配置是否就绪
     * 检查聊天模型和嵌入模型是否都已配置且启用
     *
     * @return ResultVO包含模型检查结果
     */
    @GetMapping("/check-ready")
    public ResultVO<ModelCheckVo> checkReady() {
        // 检查聊天模型是否已配置且启用
        ModelConfigDTO chatModel = modelConfigDataService.getActiveConfigByType(ModelType.CHAT);
        // 检查嵌入模型是否已配置且启用
        ModelConfigDTO embeddingModel = modelConfigDataService.getActiveConfigByType(ModelType.EMBEDDING);

        boolean chatModelReady = chatModel != null;
        boolean embeddingModelReady = embeddingModel != null;
        boolean ready = chatModelReady && embeddingModelReady;

        return ResultVO.success("模型配置检查完成",
                ModelCheckVo.builder()
                        .chatModelReady(chatModelReady)
                        .embeddingModelReady(embeddingModelReady)
                        .ready(ready)
                        .build());
    }

    /**
     * 批量脱敏：复制 DTO 列表并置空 apiKey，避免污染缓存对象和泄露敏感信息
     *
     * @param configs 原始 DTO 列表
     * @return 脱敏后的 DTO 列表（新对象，apiKey 为 null）
     */
    private List<ModelConfigDTO> sanitizeList(List<ModelConfigDTO> configs) {
        if (configs == null) {
            return null;
        }
        return configs.stream().map(this::sanitize).collect(Collectors.toList());
    }

    /**
     * 单个脱敏：用 BeanUtils 复制 DTO 后置空 apiKey
     * 使用复制而非原对象操作，确保缓存中的对象不受影响
     *
     * @param config 原始 DTO
     * @return 脱敏后的 DTO（新对象，apiKey 为 null）
     */
    private ModelConfigDTO sanitize(ModelConfigDTO config) {
        if (config == null) {
            return null;
        }
        ModelConfigDTO copy = new ModelConfigDTO();
        BeanUtils.copyProperties(config, copy);
        copy.setApiKey(null);
        return copy;
    }
}
