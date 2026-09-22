import ballerina/os;

// merchant-db (postgres-cnpg platform resource). May be empty in a sandbox
// where the resource has not been provisioned yet; db.bal falls back to
// sensible local defaults so the service still builds and starts.
configurable string dbHost = os:getEnv("MERCHANT_DB_HOST");
configurable string dbPortRaw = os:getEnv("MERCHANT_DB_PORT");
configurable string dbName = os:getEnv("MERCHANT_DB_DBNAME");
configurable string dbUser = os:getEnv("MERCHANT_DB_USER");
configurable string dbPassword = os:getEnv("MERCHANT_DB_PASSWORD");

// payment-gateway (external dependency). Injected address may end in "/".
configurable string paymentGatewayBaseUrl = os:getEnv("PAYMENT_GATEWAY_BASE_URL");
