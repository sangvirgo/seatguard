package com.seatguard.booking.payment;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentMethod;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VnpayPaymentProvider implements PaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(VnpayPaymentProvider.class);

    @Value("${vnpay.enabled:}")
    private String enabledStr;

    @Value("${vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${vnpay.payment-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String paymentUrl;

    @Value("${vnpay.return-url:http://localhost:3001/payment/result}")
    private String returnUrl;

    @Value("${vnpay.ipn-url:http://localhost:8080/api/payments/vnpay/ipn}")
    private String ipnUrl;

    private boolean isEnabled() {
        return "true".equalsIgnoreCase(enabledStr != null ? enabledStr.trim() : "");
    }

    private boolean isConfigComplete() {
        return tmnCode != null && !tmnCode.isBlank()
                && hashSecret != null && !hashSecret.isBlank();
    }

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.VNPAY;
    }

    @Override
    public PaymentResult initiatePayment(Payment payment) {
        if (!isEnabled()) {
            return PaymentResult.failed("VNPay sandbox is not configured in this demo environment");
        }

        if (!isConfigComplete()) {
            return PaymentResult.failed("VNPay sandbox credentials are incomplete. Please configure VNPAY_TMN_CODE and VNPAY_HASH_SECRET");
        }

        // TODO: Implement VNPay HMAC-SHA512 hash generation and URL building
        String txnRef = payment.getId().toString();
        log.info("VNPay payment initiated (sandbox-ready): txnRef={}", txnRef);

        // In production, generate hash and build full URL
        String url = paymentUrl + "?vnp_TmnCode=" + tmnCode
                + "&vnp_TxnRef=" + txnRef
                + "&vnp_OrderInfo=SeatGuard Payment";
        return PaymentResult.pending(url, txnRef);
    }

    @Override
    public boolean verifyCallback(String payload, String signature) {
        // TODO: Implement VNPay HMAC-SHA512 hash verification
        log.warn("VNPay signature verification not implemented");
        return false;
    }

    @Override
    public PaymentResult handleCallback(String payload) {
        return PaymentResult.failed("VNPay callback verification not implemented");
    }
}
