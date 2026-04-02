package com.smartcampus.exception;

public class BookingBadRequestException extends RuntimeException {
    public BookingBadRequestException(String message) {
        super(message);
    }
}
