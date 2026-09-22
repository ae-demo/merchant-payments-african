function validatePaymentInput(PaymentInput payload) returns boolean {
    if payload.method == "mobile_money" {
        string? number = payload?.mobileMoneyNumber;
        return number is string && number.trim() != "";
    }
    string? cardNumber = payload?.cardNumber;
    string? cardExpiry = payload?.cardExpiry;
    string? cardCvv = payload?.cardCvv;
    return cardNumber is string && cardNumber.trim() != ""
        && cardExpiry is string && cardExpiry.trim() != ""
        && cardCvv is string && cardCvv.trim() != "";
}
