import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function createTransaction(string paymentRequestId, string merchantId, decimal amount, string currency,
        string method) returns TransactionRow|error {
    string id = uuid:createRandomUuid();
    time:Utc now = time:utcNow();
    TransactionRow row = check dbClient->queryRow(`
        INSERT INTO transactions (id, payment_request_id, merchant_id, amount, currency, method, status,
                                   gateway_reference, created_at)
        VALUES (${id}, ${paymentRequestId}, ${merchantId}, ${amount}, ${currency}, ${method}, 'pending', NULL, ${now})
        RETURNING id, payment_request_id AS paymentRequestId, merchant_id AS merchantId, amount, currency, method,
                  status, gateway_reference AS gatewayReference, created_at AS createdAt
    `);
    return row;
}

function updateTransactionOutcome(string id, string status, string? gatewayReference) returns TransactionRow|error {
    TransactionRow row = check dbClient->queryRow(`
        UPDATE transactions SET status = ${status}, gateway_reference = ${gatewayReference}
        WHERE id = ${id}
        RETURNING id, payment_request_id AS paymentRequestId, merchant_id AS merchantId, amount, currency, method,
                  status, gateway_reference AS gatewayReference, created_at AS createdAt
    `);
    return row;
}

function listTransactions(string merchantId, string? status, int pageLimit, int offset)
        returns [TransactionRow[], int]|error {
    sql:ParameterizedQuery countQuery = `SELECT COUNT(*) FROM transactions WHERE merchant_id = ${merchantId}`;
    sql:ParameterizedQuery rowsQuery = `
        SELECT id, payment_request_id AS paymentRequestId, merchant_id AS merchantId, amount, currency, method,
               status, gateway_reference AS gatewayReference, created_at AS createdAt
        FROM transactions WHERE merchant_id = ${merchantId}`;
    if status is string {
        countQuery = sql:queryConcat(countQuery, ` AND status = ${status}`);
        rowsQuery = sql:queryConcat(rowsQuery, ` AND status = ${status}`);
    }
    rowsQuery = sql:queryConcat(rowsQuery, ` ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`);

    int total = check dbClient->queryRow(countQuery);
    stream<TransactionRow, sql:Error?> resultStream = dbClient->query(rowsQuery);
    TransactionRow[] rows = [];
    check from TransactionRow row in resultStream
        do {
            rows.push(row);
        };
    return [rows, total];
}

// Sum of successful transaction amounts for a merchant -- half of the
// available-balance computation (db/store_payout.bal holds the other half).
function successfulTransactionTotal(string merchantId) returns decimal|error {
    // COALESCE guarantees exactly one row even with no matching transactions.
    decimal total = check dbClient->queryRow(`
        SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE merchant_id = ${merchantId} AND status = 'successful'
    `);
    return total;
}
