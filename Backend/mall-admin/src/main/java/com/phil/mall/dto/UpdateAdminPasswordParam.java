package com.phil.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;

/**
 * 修改用户名密码参数
 */
@Getter
@Setter
public class UpdateAdminPasswordParam {
    @NotEmpty
    @Schema(description = "用户名")
    private String username;
    @NotEmpty
    @Schema(description = "旧密码")
    private String oldPassword;
    @NotEmpty
    @Schema(description = "新密码")
    private String newPassword;
}
