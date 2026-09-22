import ballerina/time;

function toMerchant(MerchantRow row) returns Merchant => {
    id: row.id,
    businessName: row.businessName,
    email: row.email,
    phone: row.phone,
    country: row.country,
    currency: row.currency,
    createdAt: time:utcToString(row.createdAt)
};

function toPaymentRequest(PaymentRequestRow row) returns PaymentRequest {
    time:Utc? expiresAt = row.expiresAt;
    string? expiresAtStr = expiresAt is time:Utc ? time:utcToString(expiresAt) : ();
    PaymentRequest result = {
        id: row.id,
        amount: row.amount,
        currency: row.currency,
        status: effectiveStatus(row),
        paymentLinkUrl: string `/pay/${row.id}`,
        createdAt: time:utcToString(row.createdAt),
        expiresAt: expiresAtStr
    };
    // description is optional-but-not-nullable in the contract, so a ()
    // value must be left OMITTED rather than assigned.
    string? description = row.description;
    if description is string {
        result.description = description;
    }
    return result;
}

function toTransaction(TransactionRow row) returns Transaction => {
    id: row.id,
    paymentRequestId: row.paymentRequestId,
    amount: row.amount,
    currency: row.currency,
    method: <"mobile_money"|"card">row.method,
    status: <"pending"|"successful"|"failed">row.status,
    gatewayReference: row.gatewayReference,
    createdAt: time:utcToString(row.createdAt)
};

function toPayout(PayoutRow row) returns Payout {
    time:Utc? completedAt = row.completedAt;
    string? completedAtStr = completedAt is time:Utc ? time:utcToString(completedAt) : ();
    return {
        id: row.id,
        amount: row.amount,
        currency: row.currency,
        destinationType: <"bank"|"mobile_wallet">row.destinationType,
        destinationDetails: row.destinationDetails,
        status: <"pending"|"processing"|"completed"|"failed">row.status,
        requestedAt: time:utcToString(row.requestedAt),
        completedAt: completedAtStr
    };
}

function toPaymentLink(PaymentRequestRow row, string businessName) returns PaymentLink => {
    paymentRequestId: row.id,
    businessName: businessName,
    amount: row.amount,
    currency: row.currency,
    status: effectiveStatus(row)
};
