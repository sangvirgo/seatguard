package com.seatguard.booking.payment;

public record PaymentResult(
    boolean success,
    String paymentUrl,
    String providerOrderId,
    String transactionRef,
    String message
) {
    public static PaymentResult pending(String paymentUrl, String providerOrderId) {
        return new PaymentResult(true, paymentUrl, providerOrderId, null, "Payment initiated");
    }

    public static PaymentResult confirmed(String transactionRef) {
        return new PaymentResult(true, null, null, transactionRef, "Payment confirmed");
    }

    public static PaymentResult failed(String message) {
        return new PaymentResult(false, null, null, null, message);
    }
}
