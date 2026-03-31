package com.smartcampus.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;

    // Helper method for successful responses with data
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }
    
    // Helper method for successful responses without data
    public static ApiResponse<Void> success(String message) {
        return new ApiResponse<>(true, message, null);
    }
}
