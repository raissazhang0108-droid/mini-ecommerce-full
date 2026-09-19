package com.miniecommerce.common.api;

import java.util.stream.Collectors;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    ResponseEntity<ApiResponse<Void>> business(BusinessException e) { return ResponseEntity.status(e.status()).body(ApiResponse.error(e.code(), e.getMessage())); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> validation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream().map(x -> x.getField()+": "+x.getDefaultMessage()).collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.error(40001, message));
    }
    @ExceptionHandler(DuplicateKeyException.class)
    ResponseEntity<ApiResponse<Void>> duplicate(DuplicateKeyException e) { return ResponseEntity.status(409).body(ApiResponse.error(40900, "资源已存在或重复操作")); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> unknown(Exception e) { return ResponseEntity.internalServerError().body(ApiResponse.error(50000, "服务器内部错误")); }
}
