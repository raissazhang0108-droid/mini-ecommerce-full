package com.miniecommerce.common.api;

import org.springframework.http.HttpStatus;

public class BusinessException extends RuntimeException {
    private final int code;
    private final HttpStatus status;
    public BusinessException(int code, HttpStatus status, String message) { super(message); this.code = code; this.status = status; }
    public int code() { return code; }
    public HttpStatus status() { return status; }
    public static BusinessException badRequest(String message) { return new BusinessException(40000, HttpStatus.BAD_REQUEST, message); }
    public static BusinessException unauthorized(String message) { return new BusinessException(40100, HttpStatus.UNAUTHORIZED, message); }
    public static BusinessException forbidden(String message) { return new BusinessException(40300, HttpStatus.FORBIDDEN, message); }
    public static BusinessException notFound(String message) { return new BusinessException(40400, HttpStatus.NOT_FOUND, message); }
    public static BusinessException conflict(String message) { return new BusinessException(40900, HttpStatus.CONFLICT, message); }
}
