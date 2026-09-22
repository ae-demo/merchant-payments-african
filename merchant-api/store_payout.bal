import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

function createPayout(string merchantId, PayoutInput input, string currency) returns PayoutRow|error {
    string id = uuid:createRandomUuid();
    time:Utc now = time:utcNow();
    PayoutRow row = check dbClient->queryRow(`
        INSERT INTO payouts (id, merchant_id, amount, currency, destination_type, destination_details, status,
                              requested_at, completed_at)
        VALUES (${id}, ${merchantId}, ${input.amount}, ${currency}, ${input.destinationType},
                ${input.destinationDetails}, 'pending', ${now}, NULL)
        RETURNING id, merchant_id AS merchantId, amount, currency, destination_type AS destinationType,
                  destination_details AS destinationDetails, status, requested_at AS requestedAt,
                  completed_at AS completedAt
    `);
    return row;
}

function updatePayoutOutcome(string id, string status, boolean completed) returns PayoutRow|error {
    PayoutRow row;
    if completed {
        time:Utc now = time:utcNow();
        row = check dbClient->queryRow(`
            UPDATE payouts SET status = ${status}, completed_at = ${now} WHERE id = ${id}
            RETURNING id, merchant_id AS merchantId, amount, currency, destination_type AS destinationType,
                      destination_details AS destinationDetails, status, requested_at AS requestedAt,
                      completed_at AS completedAt
        `);
    } else {
        row = check dbClient->queryRow(`
            UPDATE payouts SET status = ${status} WHERE id = ${id}
            RETURNING id, merchant_id AS merchantId, amount, currency, destination_type AS destinationType,
                      destination_details AS destinationDetails, status, requested_at AS requestedAt,
                      completed_at AS completedAt
        `);
    }
    return row;
}

function listPayouts(string merchantId, int pageLimit, int offset) returns [PayoutRow[], int]|error {
    int total = check dbClient->queryRow(`SELECT COUNT(*) FROM payouts WHERE merchant_id = ${merchantId}`);
    stream<PayoutRow, sql:Error?> resultStream = dbClient->query(`
        SELECT id, merchant_id AS merchantId, amount, currency, destination_type AS destinationType,
               destination_details AS destinationDetails, status, requested_at AS requestedAt,
               completed_at AS completedAt
        FROM payouts WHERE merchant_id = ${merchantId}
        ORDER BY requested_at DESC LIMIT ${pageLimit} OFFSET ${offset}
    `);
    PayoutRow[] rows = [];
    check from PayoutRow row in resultStream
        do {
            rows.push(row);
        };
    return [rows, total];
}

// Sum of payout amounts already committed against the merchant's balance.
// pending, processing AND completed all reduce available balance -- a
// merchant cannot request a second payout against funds an earlier request
// already claimed, even while that earlier request is still in flight at the
// gateway. Only a payout that ends in "failed" gives the funds back.
function committedPayoutTotal(string merchantId) returns decimal|error {
    decimal total = check dbClient->queryRow(`
        SELECT COALESCE(SUM(amount), 0) FROM payouts
        WHERE merchant_id = ${merchantId} AND status IN ('pending', 'processing', 'completed')
    `);
    return total;
}
