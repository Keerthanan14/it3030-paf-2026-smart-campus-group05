package com.smartcampus.exception;

public class BookingForbiddenException extends RuntimeException {
    public BookingForbiddenException(String message) {
        super(message);
    }
}
