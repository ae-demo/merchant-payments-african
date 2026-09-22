import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function createPaymentRequest(string merchantId, PaymentRequestInput input, string currency)
        returns PaymentRequestRow|error {
    string id = uuid:createRandomUuid();
    time:Utc now = time:utcNow();
    string? description = input?.description;
    PaymentRequestRow row = check dbClient->queryRow(`
        INSERT INTO payment_requests (id, merchant_id, amount, currency, description, status, created_at, expires_at)
        VALUES (${id}, ${merchantId}, ${input.amount}, ${currency}, ${description}, 'pending', ${now}, NULL)
        RETURNING id, merchant_id AS merchantId, amount, currency, description, status,
                  created_at AS createdAt, expires_at AS expiresAt
    `);
    return row;
}

// + return - the row, () when no payment request exists with that id at all
function findPaymentRequest(string id) returns PaymentRequestRow?|error {
    PaymentRequestRow|error row = dbClient->queryRow(`
        SELECT id, merchant_id AS merchantId, amount, currency, description, status,
               created_at AS createdAt, expires_at AS expiresAt
        FROM payment_requests WHERE id = ${id}
    `);
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}

// Scoped to the caller's own rows -- a payment request that exists but
// belongs to another merchant is treated exactly like one that does not
// exist (api-management: a row that is not the caller's is a 404).
function findMyPaymentRequest(string id, string merchantId) returns PaymentRequestRow?|error {
    PaymentRequestRow|error row = dbClient->queryRow(`
        SELECT id, merchant_id AS merchantId, amount, currency, description, status,
               created_at AS createdAt, expires_at AS expiresAt
        FROM payment_requests WHERE id = ${id} AND merchant_id = ${merchantId}
    `);
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}

function listPaymentRequests(string merchantId, string? status, int pageLimit, int offset)
        returns [PaymentRequestRow[], int]|error {
    sql:ParameterizedQuery countQuery = `SELECT COUNT(*) FROM payment_requests WHERE merchant_id = ${merchantId}`;
    sql:ParameterizedQuery rowsQuery = `
        SELECT id, merchant_id AS merchantId, amount, currency, description, status,
               created_at AS createdAt, expires_at AS expiresAt
        FROM payment_requests WHERE merchant_id = ${merchantId}`;
    if status is string {
        countQuery = sql:queryConcat(countQuery, ` AND status = ${status}`);
        rowsQuery = sql:queryConcat(rowsQuery, ` AND status = ${status}`);
    }
    rowsQuery = sql:queryConcat(rowsQuery, ` ORDER BY created_at DESC LIMIT ${pageLimit} OFFSET ${offset}`);

    int total = check dbClient->queryRow(countQuery);
    stream<PaymentRequestRow, sql:Error?> resultStream = dbClient->query(rowsQuery);
    PaymentRequestRow[] rows = [];
    check from PaymentRequestRow row in resultStream
        do {
            rows.push(row);
        };
    return [rows, total];
}

function markPaymentRequestPaid(string id) returns error? {
    _ = check dbClient->execute(`UPDATE payment_requests SET status = 'paid' WHERE id = ${id}`);
}
