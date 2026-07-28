package com.smartuniversity.payment.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class SslCommerzService {

    private static final Logger log = LoggerFactory.getLogger(SslCommerzService.class);

    @Value("${sslcommerz.store-id:}")
    private String storeId;

    @Value("${sslcommerz.store-password:}")
    private String storePassword;

    @Value("${sslcommerz.sandbox:true}")
    private boolean sandbox;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    private final RestTemplate restTemplate;

    public SslCommerzService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> initiatePayment(String transactionId, String amount, String currency,
                                                String customerName, String customerEmail, String customerPhone) {
        String url = sandbox
                ? "https://sandbox.sslcommerz.com/gwprocess/v3/process.php"
                : "https://securepay.sslcommerz.com/gwprocess/v3/process.php";

        Map<String, String> params = new HashMap<>();
        params.put("store_id", storeId);
        params.put("store_passwd", storePassword);
        params.put("total_amount", amount);
        params.put("currency", currency);
        params.put("tran_id", transactionId);
        params.put("success_url", frontendUrl + "/payment/callback?transactionId=" + transactionId + "&status=SUCCESS");
        params.put("fail_url", frontendUrl + "/payment/callback?transactionId=" + transactionId + "&status=FAILED");
        params.put("cancel_url", frontendUrl + "/payment/callback?transactionId=" + transactionId + "&status=CANCELLED");
        params.put("emi_option", "0");
        params.put("cus_name", customerName);
        params.put("cus_email", customerEmail);
        params.put("cus_phone", customerPhone);
        params.put("shipping_method", "NO");
        params.put("product_name", "University Payment");
        params.put("product_category", "Education");
        params.put("product_profile", "noncategory");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getBody() != null) {
                log.info("SSLCommerz response for {}: {}", transactionId, response.getBody().get("status"));
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("SSLCommerz initiation failed for {}: {}", transactionId, e.getMessage());
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("status", "FAILED");
        fallback.put("message", "Payment gateway unreachable");
        return fallback;
    }

    public boolean validateSignature(String valId, String amount, String currency) {
        String url = sandbox
                ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
                : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

        Map<String, String> params = new HashMap<>();
        params.put("val_id", valId);
        params.put("store_id", storeId);
        params.put("store_passwd", storePassword);
        params.put("amount", amount);
        params.put("currency", currency);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getBody() != null) {
                return "VALID".equals(response.getBody().get("status"));
            }
        } catch (Exception e) {
            log.error("SSLCommerz validation failed: {}", e.getMessage());
        }
        return false;
    }
}
