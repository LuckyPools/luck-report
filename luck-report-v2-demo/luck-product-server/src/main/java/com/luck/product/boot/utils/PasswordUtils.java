package com.luck.product.boot.utils;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.DigestUtils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 密码工具
 * @author luck
 */
public class PasswordUtils {

    private static Logger logger = LoggerFactory.getLogger(PasswordUtils.class);

    /**
     * 校验从前端传过来的密码
     * @param password 前端传过来的密码，已经过 SHA256加密
     * @param finalPassword 数据库密码，已经过 SHA256、md5 双重加密
     * @return
     */
    public static boolean validatePassword(String password,String finalPassword){
        String md5Password = encryptMd5Password(password);
        return StringUtils.equals(md5Password,finalPassword);
    }

    /**
     * 生成双重加密后字符串
     * 密码 -> SHA256加密 -> md5加密 -> 数据库密码
     * @param password
     * @return
     */
    public static String generateEncryptPassword(String password) {
        String shaPassword = encryptSHAPassword(password);
        String md5Password = encryptMd5Password(shaPassword);
        return md5Password;
    }


    /**
     * 获取 md5 加密后字符串
     * @param password
     * @return
     */
    public static String encryptMd5Password(String password) {
        return DigestUtils.md5DigestAsHex(password.getBytes());
    }

    /**
     * 获取 sha-256 加密后字符串
     * 和前端 sha-256 加密一致
     * @param password
     * @return
     */
    public static String encryptSHAPassword(String password) {
        String encryptMode = "SHA-256";
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance(encryptMode);
            byte[] encodedHash = digest.digest(password.getBytes());
            return bytesToHex(encodedHash);
        } catch (NoSuchAlgorithmException e) {
            logger.error("sha-256 加密失败",e);
        }
        return StringUtils.EMPTY;
    }

    /**
     * 字节转哈希
     * @param hash
     * @return
     */
    public static String bytesToHex(byte[] hash) {
        StringBuilder hexString = new StringBuilder(2 * hash.length);
        for (int i = 0; i < hash.length; i++) {
            String hex = Integer.toHexString(0xff & hash[i]);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * 密码 -> 前端SHA256加密 -> 后端md5加密 -> 数据库密码
     * @param args
     */
    public static void main(String[] args) {
        String password = "1";
        System.out.println(generateEncryptPassword(password));
    }
}
