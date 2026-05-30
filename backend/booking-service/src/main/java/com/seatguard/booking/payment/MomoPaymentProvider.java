package com.seatguard.booking.payment;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentMethod;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class MomoPaymentProvider implements PaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(MomoPaymentProvider.class);

    @Value("${momo.enabled:}")
    private String enabledStr;

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

    private boolean isEnabled() {
        return "true".equalsIgnoreCase(enabledStr != null ? enabledStr.trim() : "");
    }

    private boolean isConfigComplete() {
        return partnerCode != null && !partnerCode.isBlank()
                && accessKey != null && !accessKey.isBlank()
                && secretKey != null && !secretKey.isBlank();
    }

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.MOMO;
    }

    @Override
    public PaymentResult initiatePayment(Payment payment) {
        if (!isEnabled()) {
            return PaymentResult.failed("MoMo sandbox is not configured in this demo environment");
        }

        if (!isConfigComplete()) {
            return PaymentResult.failed("MoMo sandbox credentials are incomplete. Please configure MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, and MOMO_SECRET_KEY");
        }

        // TODO: Implement MoMo HMAC-SHA256 signature generation and API call
        String orderId = partnerCode + "-" + payment.getId();
        String requestId = orderId;
        log.info("MoMo payment initiated (sandbox-ready): orderId={}", orderId);

        // In production, sign with HMAC-SHA256 and call MoMo API
        // For now, return sandbox-ready status
        String paymentUrl = endpoint + "?partnerCode=" + partnerCode + "&orderId=" + orderId;
        return PaymentResult.pending(paymentUrl, orderId);
    }

    @Override
    public boolean verifyCallback(String payload, String signature) {
        // TODO: Implement MoMo HMAC-SHA256 signature verification
        log.warn("MoMo signature verification not implemented");
        return false;
    }

    @Override
    public PaymentResult handleCallback(String payload) {
        return PaymentResult.failed("MoMo callback verification not implemented");
    }
}
