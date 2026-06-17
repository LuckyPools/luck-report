package com.luck.product.boot.properties;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 网关白名单配置
 *
 * @author luck
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Component
@ConfigurationProperties(prefix = "security.ignore")
public class SecurityIgnoreProperties {

  /**
   * 鉴权白名单
   */
  private List<String> authUrls;
}
