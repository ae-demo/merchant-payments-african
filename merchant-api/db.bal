import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// Sensible local defaults so the service starts with no required environment
// variables; the platform overrides every one of these once merchant-db is
// provisioned.
final string effectiveDbHost = dbHost == "" ? "localhost" : dbHost;
final string effectiveDbUser = dbUser == "" ? "postgres" : dbUser;
final string effectiveDbPassword = dbPassword == "" ? "postgres" : dbPassword;
final string effectiveDbName = dbName == "" ? "postgres" : dbName;
final int effectiveDbPort = resolveDbPort(dbPortRaw);

function resolveDbPort(string raw) returns int {
    if raw == "" {
        return 5432;
    }
    int|error parsed = int:fromString(raw);
    if parsed is int {
        return parsed;
    }
    return 5432;
}

final postgresql:Client dbClient = check new (
    host = effectiveDbHost,
    username = effectiveDbUser,
    password = effectiveDbPassword,
    database = effectiveDbName,
    port = effectiveDbPort
);

function initSchema() returns error? {
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS merchants (
            id TEXT PRIMARY KEY,
            business_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            country TEXT NOT NULL,
            currency TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS payment_requests (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL,
            amount DECIMAL NOT NULL,
            currency TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL,
            expires_at TIMESTAMPTZ
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            payment_request_id TEXT NOT NULL,
            merchant_id TEXT NOT NULL,
            amount DECIMAL NOT NULL,
            currency TEXT NOT NULL,
            method TEXT NOT NULL,
            status TEXT NOT NULL,
            gateway_reference TEXT,
            created_at TIMESTAMPTZ NOT NULL
        )
    `);
    _ = check dbClient->execute(`
        CREATE TABLE IF NOT EXISTS payouts (
            id TEXT PRIMARY KEY,
            merchant_id TEXT NOT NULL,
            amount DECIMAL NOT NULL,
            currency TEXT NOT NULL,
            destination_type TEXT NOT NULL,
            destination_details TEXT NOT NULL,
            status TEXT NOT NULL,
            requested_at TIMESTAMPTZ NOT NULL,
            completed_at TIMESTAMPTZ
        )
    `);
}

// Runs before the listener starts, so a schema failure fails the service
// fast. In a sandbox where merchant-db has no credentials yet, this simply
// means the service will not start until it is provisioned -- expected here.
final () dbReady = check initSchema();
