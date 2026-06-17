package com.luck.product.boot.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT工具类
 * @author luck
 * @date 2025/03/31
 */
@Component
public class JwtUtils {
    
    private static String secret;
    private static Long expiration;
    
    @Value("${jwt.secret:luck-product-secret-key}")
    public void setSecret(String secret) {
        JwtUtils.secret = secret;
    }
    
    @Value("${jwt.expiration:86400000}")
    public void setExpiration(Long expiration) {
        JwtUtils.expiration = expiration;
    }
    
    /**
     * 生成token
     * @param claims 载荷
     * @return token
     */
    public static String generateToken(Map<String, Object> claims) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }
    
    /**
     * 从token中获取claims
     * @param token token
     * @return claims
     */
    public static Claims getClaimsFromToken(String token) {
        try {
            return Jwts.parser()
                    .setSigningKey(secret)
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * 获取用户名
     * @param token token
     * @return 用户名
     */
    public static String getUsernameFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        if (claims == null) {
            return null;
        }
        return claims.getSubject();
    }
    
    /**
     * 验证token是否有效
     * @param token token
     * @return 是否有效
     */
    public static boolean validateToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            if (claims == null) {
                return false;
            }
            return !claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 生成token
     * @param username 用户名
     * @return token
     */
    public static String generateToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", username);
        return generateToken(claims);
    }
    
    /**
     * 获取token（从请求头中）
     * @param request 请求
     * @return token
     */
    public static String getToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7);
        }
        return null;
    }
    
    /**
     * 检查token是否过期
     * @param token token
     * @return 是否过期
     */
    public static boolean isTokenExpired(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            if (claims == null) {
                return true;
            }
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}
