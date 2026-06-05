package com.luck.report.agent.modules.datasource.handler;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 数据源类型处理器注册中心
 * 管理所有DatasourceTypeHandler实例，根据类型名查找对应处理器
 *
 * @author luck
 */
@Component
public class DatasourceTypeHandlerRegistry {

    private final Map<String, DatasourceTypeHandler> handlerMap = new ConcurrentHashMap<>();

    /**
     * 构造方法，自动注册所有处理器
     *
     * @param handlers Spring注入的所有DatasourceTypeHandler实现
     */
    public DatasourceTypeHandlerRegistry(List<DatasourceTypeHandler> handlers) {
        handlers.forEach(this::register);
    }

    /**
     * 注册处理器
     *
     * @param handler 数据源类型处理器
     */
    public void register(DatasourceTypeHandler handler) {
        handlerMap.put(normalizeType(handler.typeName()), handler);
    }

    /**
     * 判断类型是否已注册
     *
     * @param type 数据源类型
     * @return 是否已注册
     */
    public boolean isRegistered(String type) {
        return handlerMap.containsKey(normalizeType(type));
    }

    /**
     * 获取指定类型的处理器（必须存在，否则抛异常）
     *
     * @param type 数据源类型
     * @return 对应的处理器
     * @throws IllegalArgumentException 类型为空时抛出
     * @throws IllegalStateException 类型未注册时抛出
     */
    public DatasourceTypeHandler getRequired(String type) {
        if (!StringUtils.hasText(type)) {
            throw new IllegalArgumentException("数据源类型不能为空");
        }
        DatasourceTypeHandler handler = handlerMap.get(normalizeType(type));
        if (handler == null) {
            throw new IllegalStateException("不支持的数据源类型: " + type);
        }
        return handler;
    }

    /**
     * 标准化类型名称（小写+去空格）
     *
     * @param type 原始类型名
     * @return 标准化后的类型名
     */
    private String normalizeType(String type) {
        if (!StringUtils.hasText(type)) {
            return "";
        }
        return type.trim().toLowerCase(Locale.ROOT);
    }
}
