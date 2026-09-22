import ballerina/http;

listener http:Listener ep0 = new (9090);

service http:InterceptableService / on ep0 {

    public function createInterceptors() returns AssertionInterceptor => new;

    # The caller's merchant profile
    resource function get me/merchant(http:RequestContext ctx) returns Merchant|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        MerchantRow? merchant = check findMerchant(caller.userId);
        if merchant is () {
            return <ErrorNotFound>{body: {code: 404, message: "merchant profile not registered"}};
        }
        return toMerchant(merchant);
    }

    # Register the caller's merchant profile
    resource function post me/merchant(http:RequestContext ctx, MerchantInput payload)
            returns MerchantCreated|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        if payload.businessName.trim() == "" || payload.email.trim() == "" || payload.phone.trim() == ""
                || payload.country.trim() == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "businessName, email, phone and country are all required"}};
        }
        string currency = currencyForCountry(payload.country);
        MerchantRow row = check upsertMerchant(caller.userId, payload, currency);
        return <MerchantCreated>{body: toMerchant(row)};
    }

    # The caller's payment requests
    resource function get me/payment\-requests(http:RequestContext ctx, "pending"|"paid"|"expired"? status,
            int 'limit = 20, int offset = 0) returns PaymentRequestPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int effectiveLimit = 'limit > 100 ? 100 : 'limit;
        [PaymentRequestRow[], int] pageResult = check listPaymentRequests(caller.userId, status, effectiveLimit, offset);
        PaymentRequestRow[] rows = pageResult[0];
        int total = pageResult[1];
        PaymentRequest[] data = from PaymentRequestRow row in rows select toPaymentRequest(row);
        string extraQuery = status is string ? string `&status=${status}` : "";
        [string?, string?] links = pageLinks("/me/payment-requests", extraQuery, effectiveLimit, offset, total);
        return {count: total, next: links[0], previous: links[1], data};
    }

    # Create a payment request
    resource function post me/payment\-requests(http:RequestContext ctx, PaymentRequestInput payload)
            returns PaymentRequestCreated|ErrorBadRequest|http:Unauthorized|ErrorForbidden|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        if payload.amount <= 0d {
            return <ErrorBadRequest>{body: {code: 400, message: "amount must be positive"}};
        }
        MerchantRow? merchant = check findMerchant(caller.userId);
        if merchant is () {
            return <ErrorBadRequest>{body: {code: 400, message: "register a merchant profile before creating payment requests"}};
        }
        PaymentRequestRow row = check createPaymentRequest(caller.userId, payload, merchant.currency);
        return <PaymentRequestCreated>{body: toPaymentRequest(row)};
    }

    # One of the caller's payment requests
    resource function get me/payment\-requests/[string paymentRequestId](http:RequestContext ctx)
            returns PaymentRequest|ErrorNotFound|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        PaymentRequestRow? row = check findMyPaymentRequest(paymentRequestId, caller.userId);
        if row is () {
            return <ErrorNotFound>{body: {code: 404, message: "payment request not found"}};
        }
        return toPaymentRequest(row);
    }

    # The caller's transactions
    resource function get me/transactions(http:RequestContext ctx, "pending"|"successful"|"failed"? status,
            int 'limit = 20, int offset = 0) returns TransactionPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int effectiveLimit = 'limit > 100 ? 100 : 'limit;
        [TransactionRow[], int] pageResult = check listTransactions(caller.userId, status, effectiveLimit, offset);
        TransactionRow[] rows = pageResult[0];
        int total = pageResult[1];
        Transaction[] data = from TransactionRow row in rows select toTransaction(row);
        string extraQuery = status is string ? string `&status=${status}` : "";
        [string?, string?] links = pageLinks("/me/transactions", extraQuery, effectiveLimit, offset, total);
        return {count: total, next: links[0], previous: links[1], data};
    }

    # The caller's available balance
    resource function get me/balance(http:RequestContext ctx) returns Balance|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        decimal available = check computeAvailableBalance(caller.userId);
        MerchantRow? merchant = check findMerchant(caller.userId);
        string currency = merchant is MerchantRow ? merchant.currency : "USD";
        return {available, currency};
    }

    # The caller's payout requests
    resource function get me/payouts(http:RequestContext ctx, int 'limit = 20, int offset = 0)
            returns PayoutPage|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        int effectiveLimit = 'limit > 100 ? 100 : 'limit;
        [PayoutRow[], int] pageResult = check listPayouts(caller.userId, effectiveLimit, offset);
        PayoutRow[] rows = pageResult[0];
        int total = pageResult[1];
        Payout[] data = from PayoutRow row in rows select toPayout(row);
        [string?, string?] links = pageLinks("/me/payouts", "", effectiveLimit, offset, total);
        return {count: total, next: links[0], previous: links[1], data};
    }

    # Request a payout of the caller's available balance
    resource function post me/payouts(http:RequestContext ctx, PayoutInput payload)
            returns PayoutCreated|ErrorBadRequest|http:Unauthorized|error {
        GatewayCaller|http:Unauthorized caller = requireGatewayCaller(ctx);
        if caller is http:Unauthorized {
            return caller;
        }
        if payload.amount <= 0d {
            return <ErrorBadRequest>{body: {code: 400, message: "amount must be positive"}};
        }
        if payload.destinationDetails.trim() == "" {
            return <ErrorBadRequest>{body: {code: 400, message: "destinationDetails is required"}};
        }
        MerchantRow? merchant = check findMerchant(caller.userId);
        if merchant is () {
            return <ErrorBadRequest>{body: {code: 400, message: "register a merchant profile before requesting a payout"}};
        }
        decimal available = check computeAvailableBalance(caller.userId);
        if payload.amount > available {
            return <ErrorBadRequest>{body: {code: 400, message: "insufficient balance"}};
        }
        PayoutRow created = check createPayout(caller.userId, payload, merchant.currency);
        PayoutOutcome outcome = requestPayoutAndMapOutcome(caller.userId, payload.amount, merchant.currency,
                payload.destinationType, payload.destinationDetails, created.id);
        PayoutRow updated = check updatePayoutOutcome(created.id, outcome.status, outcome.completed);
        return <PayoutCreated>{body: toPayout(updated)};
    }

    # A payment request, for the paying customer -- public, reads no identity
    resource function get payment\-links/[string paymentRequestId]() returns PaymentLink|ErrorNotFound|error {
        PaymentRequestRow? row = check findPaymentRequest(paymentRequestId);
        if row is () {
            return <ErrorNotFound>{body: {code: 404, message: "payment link not found"}};
        }
        if effectiveStatus(row) == "expired" {
            return <ErrorNotFound>{body: {code: 404, message: "payment link expired"}};
        }
        MerchantRow? merchant = check findMerchant(row.merchantId);
        string businessName = merchant is MerchantRow ? merchant.businessName : "";
        return toPaymentLink(row, businessName);
    }

    # Pay a payment request as a guest, via mobile money or card -- public, reads no identity
    resource function post payment\-links/[string paymentRequestId]/pay(PaymentInput payload)
            returns Transaction|ErrorBadRequest|ErrorNotFound|error {
        PaymentRequestRow? row = check findPaymentRequest(paymentRequestId);
        if row is () {
            return <ErrorNotFound>{body: {code: 404, message: "payment link not found"}};
        }
        string status = effectiveStatus(row);
        if status == "expired" {
            return <ErrorNotFound>{body: {code: 404, message: "payment link expired"}};
        }
        if status == "paid" {
            return <ErrorBadRequest>{body: {code: 400, message: "payment request already paid"}};
        }
        if !validatePaymentInput(payload) {
            return <ErrorBadRequest>{body: {code: 400, message: "missing payment details for the chosen method"}};
        }
        TransactionRow created = check createTransaction(row.id, row.merchantId, row.amount, row.currency, payload.method);
        PaymentOutcome outcome = chargeAndMapOutcome(row.merchantId, row.amount, row.currency, payload.method, created.id);
        TransactionRow updated = check updateTransactionOutcome(created.id, outcome.status, outcome.gatewayReference);
        if outcome.status == "successful" {
            check markPaymentRequestPaid(row.id);
        }
        return toTransaction(updated);
    }
}
