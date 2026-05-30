package com.seatguard.booking.payment;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MomoPaymentProvider implements PaymentProvider {

    @Value("${momo.enabled:false}")
    private boolean enabled;

    @Value("${momo.partner-code:}")
    private String partnerCode;

    @Value("${momo.access-key:}")
    private String accessKey;

    @Value("${momo.secret-key:}")
    private String secretKey;

    @Value("${momo.endpoint:https://test-payment.momo.vn}")
    private String endpoint;

    @Value("${momo.return-url:http://localhost:3001/payment/result}")
    private String returnUrl;

    @Value("${momo.notify-url:http://localhost:8080/api/payments/momo/ipn}")
    private String notifyUrl;

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.MOMO;
    }

    @Override
    public PaymentResult initiatePayment(Payment payment) {
        if (!enabled) {
            return PaymentResult.failed("MoMo sandbox is not configured in this demo environment");
        }

        // TODO: Implement MoMo signature generation and API call
        // For now, return sandbox-ready status
        String orderId = partnerCode + "-" + payment.getId();
        String requestId = orderId;
        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + payment.getAmount().toBigInteger()
                + "&extraData="
                + "&ipnUrl=" + notifyUrl
                + "&orderId=" + orderId
                + "&orderInfo=SeatGuard Payment"
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + returnUrl
                + "&requestId=" + requestId
                + "&requestType=payWithMethod";

        // In production, sign with HMAC-SHA256 and call MoMo API
        // For sandbox-ready, return a placeholder URL
        String paymentUrl = endpoint + "?partnerCode=" + partnerCode + "&orderId=" + orderId;

        return PaymentResult.pending(paymentUrl, orderId);
    }

    @Override
    public boolean verifyCallback(String payload, String signature) {
        // TODO: Implement MoMo signature verification
        return false;
    }

    @Override
    public PaymentResult handleCallback(String payload) {
        return PaymentResult.failed("MoMo callback not implemented");
    }
}
