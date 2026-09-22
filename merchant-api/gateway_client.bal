import merchant_api.paymentgateway;

function trimTrailingSlash(string url) returns string {
    if url.endsWith("/") {
        return url.substring(0, url.length() - 1);
    }
    return url;
}

final string effectivePaymentGatewayBaseUrl = trimTrailingSlash(paymentGatewayBaseUrl);

final paymentgateway:Client paymentGatewayClient = check new (
    serviceUrl = effectivePaymentGatewayBaseUrl == "" ? "http://localhost:8080/v1" : effectivePaymentGatewayBaseUrl
);

// payment-gateway's CreatePaymentRequest/CreatePayoutRequest amount is an
// integer, while this service's own PaymentRequest/Transaction/Payout amount
// is a decimal. Convention used consistently on both the charge and payout
// paths: treat the decimal amount as major units and convert to the
// gateway's integer by scaling to minor units (cents) -- amount * 100,
// rounded to the nearest integer.
function toMinorUnits(decimal amount) returns int {
    return <int>(amount * 100);
}

// mobile_money -> mobile, card -> web (openapi-conventions PaymentInput.method -> payment-gateway Channel).
function toGatewayChannel(string method) returns paymentgateway:Channel {
    if method == "mobile_money" {
        return "mobile";
    }
    return "web";
}

function chargePayment(string merchantId, decimal amount, string currency, string method, string reference)
        returns paymentgateway:Payment|error {
    paymentgateway:CreatePaymentRequest request = {
        merchantId: merchantId,
        amount: toMinorUnits(amount),
        currency: currency,
        channel: toGatewayChannel(method),
        reference: reference
    };
    return paymentGatewayClient->/payments.post(request);
}

// payment-gateway only models a payout to a bank account. A mobile-wallet
// destination is mapped onto the same BankAccount shape with a fixed
// placeholder bank code, since this service's own PayoutInput carries no
// separate bank-code field.
function requestPayoutAtGateway(string merchantId, decimal amount, string currency, string destinationType,
        string destinationDetails, string reference) returns paymentgateway:Payout|error {
    paymentgateway:BankAccount bankAccount = {
        accountNumber: destinationDetails,
        bankCode: destinationType == "mobile_wallet" ? "MOBILE_WALLET" : "UNKNOWN"
    };
    paymentgateway:CreatePayoutRequest request = {
        merchantId: merchantId,
        amount: toMinorUnits(amount),
        currency: currency,
        bankAccount: bankAccount,
        reference: reference
    };
    return paymentGatewayClient->/payouts.post(request);
}

// The outcome of a guest charge, in this service's own vocabulary -- keeps
// every paymentgateway: type out of service.bal.
public type PaymentOutcome record {|
    "successful"|"failed"|"pending" status;
    string? gatewayReference;
|};

// authorized -> successful, declined -> failed (customer-guest-checkout.md);
// a client-side failure (timeout, 5xx) is treated the same as a decline so
// the transaction still resolves to a terminal-ish, payable-again state.
function chargeAndMapOutcome(string merchantId, decimal amount, string currency, string method, string reference)
        returns PaymentOutcome {
    paymentgateway:Payment|error result = chargePayment(merchantId, amount, currency, method, reference);
    if result is error {
        return {status: "failed", gatewayReference: ()};
    }
    paymentgateway:PaymentStatus gatewayStatus = result.status;
    if gatewayStatus == "authorized" {
        return {status: "successful", gatewayReference: result.paymentId};
    }
    if gatewayStatus == "declined" {
        return {status: "failed", gatewayReference: result.paymentId};
    }
    return {status: "pending", gatewayReference: result.paymentId};
}

// The outcome of a payout request, in this service's own vocabulary.
public type PayoutOutcome record {|
    "processing"|"completed"|"failed" status;
    boolean completed;
|};

// paid -> completed, failed -> failed, pending -> processing (the payout has
// been submitted and is in flight); a client-side failure is "failed" so the
// merchant's balance is not left permanently locked behind a call that never
// reached the gateway.
function requestPayoutAndMapOutcome(string merchantId, decimal amount, string currency, string destinationType,
        string destinationDetails, string reference) returns PayoutOutcome {
    paymentgateway:Payout|error result = requestPayoutAtGateway(merchantId, amount, currency, destinationType,
            destinationDetails, reference);
    if result is error {
        return {status: "failed", completed: false};
    }
    paymentgateway:PayoutStatus gatewayStatus = result.status;
    if gatewayStatus == "paid" {
        return {status: "completed", completed: true};
    }
    if gatewayStatus == "failed" {
        return {status: "failed", completed: false};
    }
    return {status: "processing", completed: false};
}
