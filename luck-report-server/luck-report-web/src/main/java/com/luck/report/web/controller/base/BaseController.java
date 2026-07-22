package com.luck.report.web.controller.base;

import com.luck.report.web.provider.RequestInfoProvider;
import com.luck.report.web.provider.ResponseInfoProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * @author jack
 * @version 1.0
 * @description: 基础控制器
 * @date 2026-04-30 16:54
 */

public class BaseController {

    @Autowired
    protected RequestInfoProvider req;
    @Autowired
    protected ResponseInfoProvider resp;

}
