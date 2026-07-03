package com.example.demo.service;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file, String fileName) throws IOException {
        Map<String, Object> options = ObjectUtils.asMap(
                "resource_type", "image",
                "folder", "englearn-images",
                "public_id", fileName,
                "overwrite", true
        );

        Map<?, ?> result = cloudinary.uploader()
                .upload(file.getBytes(), options);

        return result.get("secure_url").toString();
    }

    public void deleteImage(String publicId) throws IOException {
        cloudinary.uploader().destroy(
                "englearn-images/" + publicId,
                ObjectUtils.asMap("resource_type", "image")
        );
    }
}
