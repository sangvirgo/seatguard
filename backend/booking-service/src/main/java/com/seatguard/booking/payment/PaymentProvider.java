package com.seatguard.booking.payment;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentMethod;

public interface PaymentProvider {
    PaymentMethod getMethod();
    PaymentResult initiatePayment(Payment payment);
    boolean verifyCallback(String payload, String signature);
    PaymentResult handleCallback(String payload);
}
