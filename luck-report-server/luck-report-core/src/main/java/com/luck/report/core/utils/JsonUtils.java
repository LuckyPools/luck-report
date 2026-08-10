package com.luck.report.core.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.util.*;
import java.util.stream.Collectors;

public final class JsonUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .enable(SerializationFeature.INDENT_OUTPUT); // 默认美化输出

    private JsonUtils() {
    }

    // ==================== 序列化 ====================

    public static String toJson(Object obj) {
        try {
            return JsonUtils.MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 序列化失败", e);
        }
    }

    public static byte[] toBytes(Object obj) {
        try {
            return JsonUtils.MAPPER.writeValueAsBytes(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 序列化失败", e);
        }
    }

    // ==================== 反序列化 ====================

    public static <T> T fromJson(String json, Class<T> clazz) {
        try {
            return JsonUtils.MAPPER.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 反序列化失败", e);
        }
    }

    public static <T> T fromJson(String json, TypeReference<T> typeRef) {
        try {
            return JsonUtils.MAPPER.readValue(json, typeRef);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 反序列化失败", e);
        }
    }

    /**
     * 反序列化为 List（解决泛型擦除问题）
     */
    public static <T> List<T> fromJsonList(String json, Class<T> elementClass) {
        try {
            return JsonUtils.MAPPER.readValue(json,
                    JsonUtils.MAPPER.getTypeFactory().constructCollectionType(List.class, elementClass));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 反序列化为 List 失败", e);
        }
    }

    // ==================== 校验 ====================

    /**
     * 校验字符串是否为合法 JSON 数组
     */
    public static boolean isValidJsonArray(String json) {
        if (json == null || json.isEmpty()) return false;
        try {
            return JsonUtils.MAPPER.readTree(json).isArray();
        } catch (JsonProcessingException e) {
            return false;
        }
    }

    // ==================== Key 提取（对应前端 extractJsonKeys）====================

    /**
     * 提取 JSON 数组中所有对象的 key，去重后返回 [{name: "key1"}, {name: "key2"}]
     */
    public static List<Map<String, String>> extractArrayKeys(String jsonArray) {
        if (!JsonUtils.isValidJsonArray(jsonArray)) throw new IllegalArgumentException("输入不是合法的 JSON 数组");
        try {
            ArrayNode array = (ArrayNode) JsonUtils.MAPPER.readTree(jsonArray);
            Set<String> keys = new LinkedHashSet<>();
            array.forEach(node -> {
                if (node.isObject()) node.fieldNames().forEachRemaining(keys::add);
            });
            return keys.stream()
                    .map(k -> Collections.singletonMap("name", k))
                    .collect(Collectors.toList());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Key 提取失败", e);
        }
    }

    // ==================== 格式化 ====================

    public static String prettyPrint(String json) {
        try {
            Object tree = JsonUtils.MAPPER.readTree(json);
            return JsonUtils.MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(tree);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("JSON 格式化失败", e);
        }
    }
}