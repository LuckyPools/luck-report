package com.luck.report.agent.utils;

/**
 * Snowflake ID 生成器（静态工具类）
 * 1 位符号位 + 41 位时间戳 + 5 位 datacenterId + 5 位 workerId + 12 位序列号 = 64 位 Long
 * 返回 19 位数字字符串，避免 Long 类型 ID 在前端 JS 丢失精度
 *
 * workerId / datacenterId 通过 JVM 启动参数 -D 注入：
 *   -Dsnowflake.worker-id=1
 *   -Dsnowflake.datacenter-id=1
 * 未配置时默认为 1。
 *
 * 起始时间戳：2024-01-01 00:00:00 UTC (1704067200000L)
 *
 * @author luck
 */
public class SnowflakeIdGenerator {

    private static final long START_TIMESTAMP = 1704067200000L;

    private static final long WORKER_ID_BITS = 5L;
    private static final long DATACENTER_ID_BITS = 5L;
    private static final long SEQUENCE_BITS = 12L;

    private static final long MAX_WORKER_ID = ~(-1L << WORKER_ID_BITS);
    private static final long MAX_DATACENTER_ID = ~(-1L << DATACENTER_ID_BITS);

    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;
    private static final long DATACENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATACENTER_ID_BITS;

    private static final long SEQUENCE_MASK = ~(-1L << SEQUENCE_BITS);

    private static final long WORKER_ID;
    private static final long DATACENTER_ID;

    private static long sequence = 0L;
    private static long lastTimestamp = -1L;

    static {
        long workerId = Long.parseLong(System.getProperty("snowflake.worker-id", "1"));
        long datacenterId = Long.parseLong(System.getProperty("snowflake.datacenter-id", "1"));
        if (workerId > MAX_WORKER_ID || workerId < 0) {
            throw new IllegalArgumentException(
                    "workerId can't be greater than " + MAX_WORKER_ID + " or less than 0");
        }
        if (datacenterId > MAX_DATACENTER_ID || datacenterId < 0) {
            throw new IllegalArgumentException(
                    "datacenterId can't be greater than " + MAX_DATACENTER_ID + " or less than 0");
        }
        WORKER_ID = workerId;
        DATACENTER_ID = datacenterId;
    }

    private SnowflakeIdGenerator() {
    }

    /**
     * 生成下一个 ID
     *
     * @return 19 位数字字符串形式的 Snowflake ID
     */
    public static synchronized String generateId() {
        long currentTimestamp = System.currentTimeMillis();

        if (currentTimestamp < lastTimestamp) {
            throw new RuntimeException(
                    "Clock moved backwards. Refusing to generate id for "
                            + (lastTimestamp - currentTimestamp) + " milliseconds");
        }

        if (currentTimestamp == lastTimestamp) {
            sequence = (sequence + 1) & SEQUENCE_MASK;
            if (sequence == 0L) {
                currentTimestamp = waitNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }

        lastTimestamp = currentTimestamp;

        long id = ((currentTimestamp - START_TIMESTAMP) << TIMESTAMP_SHIFT)
                | (DATACENTER_ID << DATACENTER_ID_SHIFT)
                | (WORKER_ID << WORKER_ID_SHIFT)
                | sequence;

        return String.valueOf(id);
    }

    private static long waitNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis();
        while (timestamp <= lastTimestamp) {
            timestamp = System.currentTimeMillis();
        }
        return timestamp;
    }
}
