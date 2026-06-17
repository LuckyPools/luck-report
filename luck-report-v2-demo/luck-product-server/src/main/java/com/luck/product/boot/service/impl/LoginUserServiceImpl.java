package com.luck.product.boot.service.impl;

import com.luck.product.boot.service.ILoginUserService;
import com.luck.product.boot.domain.enums.AuthCodeEnum;
import com.luck.product.boot.domain.dto.LoginUser;
import com.luck.product.boot.domain.entity.User;
import com.luck.product.boot.service.RemoteUserService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * 用户信息service实现类
 *
 * @author luck
 * @create 2024-04-10
 **/
@Service
public class LoginUserServiceImpl implements ILoginUserService {

    @Autowired
    private RemoteUserService remoteUserService;

    @Override
    public UserDetails loadUserByUsername(String username) {
        //Assert.notBlank(username);
        User user = remoteUserService.getUserByUsername(username);
        if(user == null){
            throw new UsernameNotFoundException(AuthCodeEnum.ACCOUNT_NOT_EXIST.getMessage());
        }
        LoginUser loginUser = new LoginUser();
        BeanUtils.copyProperties(user,loginUser);
        return loginUser;
    }

}
