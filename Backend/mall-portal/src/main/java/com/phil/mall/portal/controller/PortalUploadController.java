package com.phil.mall.portal.controller;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.json.JSONUtil;
import com.phil.mall.common.api.CommonResult;
import com.phil.mall.common.dto.BucketPolicyConfigDto;
import com.phil.mall.common.dto.MinioUploadDto;
import com.phil.mall.common.exception.Asserts;
import io.minio.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * C端图片上传（评价晒图、售后凭证）
 */
@Controller
@Tag(name = "PortalUploadController", description = "C端图片上传")
@RequestMapping("/upload")
public class PortalUploadController {

    private static final Logger LOGGER = LoggerFactory.getLogger(PortalUploadController.class);

    private static final long MAX_SIZE = 5 * 1024 * 1024L;
    private static final List<String> ALLOWED_CONTENT_TYPES =
            Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp");

    @Value("${minio.endpoint}")
    private String ENDPOINT;
    @Value("${minio.bucketName}")
    private String BUCKET_NAME;
    @Value("${minio.accessKey}")
    private String ACCESS_KEY;
    @Value("${minio.secretKey}")
    private String SECRET_KEY;
    @Value("${minio.publicUrl:${minio.endpoint}}")
    private String PUBLIC_URL;

    @Operation(summary = "上传图片")
    @RequestMapping(value = "/image", method = RequestMethod.POST)
    @ResponseBody
    public CommonResult<MinioUploadDto> uploadImage(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            Asserts.fail("请选择要上传的图片");
        }
        if (file.getSize() > MAX_SIZE) {
            Asserts.fail("图片不能超过5MB");
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            Asserts.fail("只支持 jpg/png/gif/webp 格式的图片");
        }
        try {
            MinioClient minioClient = MinioClient.builder()
                    .endpoint(ENDPOINT)
                    .credentials(ACCESS_KEY, SECRET_KEY)
                    .build();
            if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(BUCKET_NAME).build())) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(BUCKET_NAME).build());
                SetBucketPolicyArgs setBucketPolicyArgs = SetBucketPolicyArgs.builder()
                        .bucket(BUCKET_NAME)
                        .config(JSONUtil.toJsonStr(createBucketPolicyConfigDto(BUCKET_NAME)))
                        .build();
                minioClient.setBucketPolicy(setBucketPolicyArgs);
            }
            String objectName = buildObjectName(file.getOriginalFilename());
            PutObjectArgs putObjectArgs = PutObjectArgs.builder()
                    .bucket(BUCKET_NAME)
                    .object(objectName)
                    .contentType(file.getContentType())
                    .stream(file.getInputStream(), file.getSize(), ObjectWriteArgs.MIN_MULTIPART_SIZE)
                    .build();
            minioClient.putObject(putObjectArgs);
            MinioUploadDto dto = new MinioUploadDto();
            dto.setName(objectName);
            dto.setUrl(PUBLIC_URL + "/" + BUCKET_NAME + "/" + objectName);
            return CommonResult.success(dto);
        } catch (Exception e) {
            LOGGER.error("图片上传失败: {}", e.getMessage(), e);
            return CommonResult.failed("图片上传失败，请稍后重试");
        }
    }

    /**
     * 对象名带 UUID，避免不同用户上传同名文件时相互覆盖
     * （admin 的 MinioController 直接用原始文件名，存在该问题）
     */
    private String buildObjectName(String originalFilename) {
        String suffix = "";
        if (originalFilename != null && originalFilename.lastIndexOf('.') > -1) {
            suffix = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
        }
        String date = new SimpleDateFormat("yyyyMMdd").format(new Date());
        return date + "/" + UUID.randomUUID().toString().replace("-", "") + suffix;
    }

    private BucketPolicyConfigDto createBucketPolicyConfigDto(String bucketName) {
        BucketPolicyConfigDto.Statement statement = BucketPolicyConfigDto.Statement.builder()
                .Effect("Allow")
                .Principal("*")
                .Action("s3:GetObject")
                .Resource("arn:aws:s3:::" + bucketName + "/*.**").build();
        return BucketPolicyConfigDto.builder()
                .Version("2012-10-17")
                .Statement(CollUtil.toList(statement))
                .build();
    }
}
