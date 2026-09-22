import ballerina/time;

// A payment request's status as read: "pending" flips to "expired" once
// expiresAt has passed, computed lazily rather than by a scheduled job (this
// service owns no background work).
function effectiveStatus(PaymentRequestRow row) returns "pending"|"paid"|"expired" {
    if row.status == "paid" {
        return "paid";
    }
    if row.status == "expired" {
        return "expired";
    }
    time:Utc? expiresAt = row.expiresAt;
    if expiresAt is time:Utc {
        time:Utc now = time:utcNow();
        if time:utcDiffSeconds(now, expiresAt) > 0d {
            return "expired";
        }
    }
    return "pending";
}
