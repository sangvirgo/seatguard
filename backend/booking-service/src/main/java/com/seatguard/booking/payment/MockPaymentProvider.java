package com.seatguard.booking.payment;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentMethod;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MockPaymentProvider implements PaymentProvider {

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.MOCK;
    }

    @Override
    public PaymentResult initiatePayment(Payment payment) {
        // Mock payment: no external URL needed, just return a reference
        String mockRef = "MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return PaymentResult.pending(null, mockRef);
    }

    @Override
    public boolean verifyCallback(String payload, String signature) {
        return true; // Mock always verifies
    }

    @Override
    public PaymentResult handleCallback(String payload) {
        return PaymentResult.confirmed("MOCK-CONFIRMED");
    }
}
