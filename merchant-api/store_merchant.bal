import ballerina/sql;
import ballerina/time;

// Registers or re-registers the caller's merchant profile. Idempotent by
// design (id is the caller's own sub) since the contract models no separate
// "already registered" error.
function upsertMerchant(string id, MerchantInput input, string currency) returns MerchantRow|error {
    time:Utc now = time:utcNow();
    MerchantRow row = check dbClient->queryRow(`
        INSERT INTO merchants (id, business_name, email, phone, country, currency, created_at)
        VALUES (${id}, ${input.businessName}, ${input.email}, ${input.phone}, ${input.country}, ${currency}, ${now})
        ON CONFLICT (id) DO UPDATE SET
            business_name = EXCLUDED.business_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            country = EXCLUDED.country,
            currency = EXCLUDED.currency
        RETURNING id, business_name AS businessName, email, phone, country, currency, created_at AS createdAt
    `);
    return row;
}

// + return - the merchant row, () when the caller has not registered one yet
function findMerchant(string id) returns MerchantRow?|error {
    MerchantRow|error row = dbClient->queryRow(`
        SELECT id, business_name AS businessName, email, phone, country, currency, created_at AS createdAt
        FROM merchants WHERE id = ${id}
    `);
    if row is sql:NoRowsError {
        return ();
    }
    return row;
}
