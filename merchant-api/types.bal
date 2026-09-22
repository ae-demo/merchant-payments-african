import ballerina/http;
import ballerina/time;

// ---- Domain types, matching specs/design/components/merchant-api/openapi.yaml exactly ----

public type Merchant record {|
    string id;
    string businessName;
    string email;
    string phone;
    // ISO country code
    string country;
    // derived from country
    string currency;
    string createdAt?;
|};

public type MerchantInput record {|
    string businessName;
    string email;
    string phone;
    string country;
|};

public type PaymentRequest record {|
    string id;
    decimal amount;
    string currency;
    string description?;
    "pending"|"paid"|"expired" status;
    string paymentLinkUrl?;
    string createdAt;
    string? expiresAt?;
|};

public type PaymentRequestInput record {|
    decimal amount;
    string description?;
|};

public type Transaction record {|
    string id;
    string paymentRequestId;
    decimal amount;
    string currency;
    "mobile_money"|"card" method;
    "pending"|"successful"|"failed" status;
    string? gatewayReference?;
    string createdAt;
|};

public type Balance record {|
    decimal available;
    string currency;
|};

public type Payout record {|
    string id;
    decimal amount;
    string currency;
    "bank"|"mobile_wallet" destinationType;
    string destinationDetails?;
    "pending"|"processing"|"completed"|"failed" status;
    string requestedAt;
    string? completedAt?;
|};

public type PayoutInput record {|
    decimal amount;
    "bank"|"mobile_wallet" destinationType;
    string destinationDetails;
|};

public type PaymentLink record {|
    string paymentRequestId;
    string businessName;
    decimal amount;
    string currency;
    "pending"|"paid"|"expired" status;
|};

public type PaymentInput record {|
    "mobile_money"|"card" method;
    string mobileMoneyNumber?;
    string cardNumber?;
    string cardExpiry?;
    string cardCvv?;
|};

public type Error record {|
    // HTTP or application error code
    int code;
    // short human-readable label
    string message;
    // detailed explanation
    string description?;
    // URI to documentation
    string moreInfo?;
|};

// ---- Page envelopes ----

public type PaymentRequestPage record {|
    int count;
    string? next = ();
    string? previous = ();
    PaymentRequest[] data;
|};

public type TransactionPage record {|
    int count;
    string? next = ();
    string? previous = ();
    Transaction[] data;
|};

public type PayoutPage record {|
    int count;
    string? next = ();
    string? previous = ();
    Payout[] data;
|};

// ---- Response wrappers ----

public type ErrorBadRequest record {|
    *http:BadRequest;
    Error body;
|};

public type ErrorUnauthorized record {|
    *http:Unauthorized;
    Error body;
|};

public type ErrorForbidden record {|
    *http:Forbidden;
    Error body;
|};

public type ErrorNotFound record {|
    *http:NotFound;
    Error body;
|};

public type MerchantCreated record {|
    *http:Created;
    Merchant body;
|};

public type PaymentRequestCreated record {|
    *http:Created;
    PaymentRequest body;
|};

public type PayoutCreated record {|
    *http:Created;
    Payout body;
|};

// ---- DB row shapes ----

public type MerchantRow record {|
    string id;
    string businessName;
    string email;
    string phone;
    string country;
    string currency;
    time:Utc createdAt;
|};

public type PaymentRequestRow record {|
    string id;
    string merchantId;
    decimal amount;
    string currency;
    string? description;
    string status;
    time:Utc createdAt;
    time:Utc? expiresAt;
|};

public type TransactionRow record {|
    string id;
    string paymentRequestId;
    string merchantId;
    decimal amount;
    string currency;
    string method;
    string status;
    string? gatewayReference;
    time:Utc createdAt;
|};

public type PayoutRow record {|
    string id;
    string merchantId;
    decimal amount;
    string currency;
    string destinationType;
    string destinationDetails;
    string status;
    time:Utc requestedAt;
    time:Utc? completedAt;
|};
