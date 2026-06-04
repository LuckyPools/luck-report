package com.luck.agent.moudules.modelconfig.controller;

import com.luck.agent.domain.dto.ModelConfigDTO;
import com.luck.agent.domain.enums.ModelType;
import com.luck.agent.domain.vo.ModelCheckVo;
import com.luck.agent.domain.vo.ResultVO;
import com.luck.agent.moudules.modelconfig.converter.ModelConfigConverter;
import com.luck.agent.moudules.modelconfig.service.ModelConfigDataService;
import javax.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 模型配置Controller
 * 提供模型配置的管理接口,包括增删改查、激活切换、连通性测试等
 *
 * @author luck
 */
@AllArgsConstructor
@RestController
@RequestMapping("/model-config")
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
            return ResultVO.success("获取模型配置列表成功", modelConfigDataService.listConfigs());
        } catch (Exception e) {
            return ResultVO.error("获取模型配置列表失败: " + e.getMessage());
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
    public ResultVO<String> delete(@PathVariable Integer id) {
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
    public ResultVO<String> activate(@PathVariable Integer id) {
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
    public ResultVO<String> deactivate(@PathVariable Integer id) {
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
            return ResultVO.success("获取激活模型列表成功", activeConfigs);
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
}
