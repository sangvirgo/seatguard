package com.seatguard.event.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Service
public class CloudinaryService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public UploadResult uploadImage(MultipartFile file) throws IOException {
        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Invalid file type. Allowed: JPEG, PNG, WebP");
        }

        // Validate file size
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new IllegalArgumentException("File too large. Max size: 5MB");
        }

        // Upload to Cloudinary
        @SuppressWarnings("unchecked")
        Map<String, Object> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "seatguard/events",
                        "resource_type", "image",
                        "transformation", "c_limit,w_1200,h_675,q_auto"
                )
        );

        return new UploadResult(
                (String) result.get("secure_url"),
                (String) result.get("public_id")
        );
    }

    public void deleteImage(String publicId) throws IOException {
        if (publicId != null && !publicId.isBlank()) {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        }
    }

    public record UploadResult(String url, String publicId) {}
}
