package com.seatguard.booking.payment;

import com.seatguard.booking.entity.Payment;
import com.seatguard.booking.entity.PaymentMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class VnpayPaymentProvider implements PaymentProvider {

    @Value("${vnpay.enabled:false}")
    private boolean enabled;

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

    @Override
    public PaymentMethod getMethod() {
        return PaymentMethod.VNPAY;
    }

    @Override
    public PaymentResult initiatePayment(Payment payment) {
        if (!enabled) {
            return PaymentResult.failed("VNPay sandbox is not configured in this demo environment");
        }

        // TODO: Implement VNPay hash generation and URL building
        // For now, return sandbox-ready status
        String txnRef = payment.getId().toString();
        String url = paymentUrl + "?vnp_TmnCode=" + tmnCode
                + "&vnp_Amount=" + payment.getAmount().toBigInteger().multiply(java.math.BigInteger.valueOf(100))
                + "&vnp_TxnRef=" + txnRef
                + "&vnp_OrderInfo=SeatGuard Payment"
                + "&vnp_ReturnUrl=" + returnUrl;

        return PaymentResult.pending(url, txnRef);
    }

    @Override
    public boolean verifyCallback(String payload, String signature) {
        // TODO: Implement VNPay hash verification
        return false;
    }

    @Override
    public PaymentResult handleCallback(String payload) {
        return PaymentResult.failed("VNPay callback not implemented");
    }
}
