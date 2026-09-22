// The caller's available balance (Story 9): successful transaction amounts
// minus payout amounts already committed. pending/processing/completed
// payouts ALL count as committed -- see store_payout.bal's
// committedPayoutTotal for why -- so a merchant cannot request a second
// payout against funds an earlier request already claimed.
function computeAvailableBalance(string merchantId) returns decimal|error {
    decimal earned = check successfulTransactionTotal(merchantId);
    decimal committed = check committedPayoutTotal(merchantId);
    decimal available = earned - committed;
    if available < 0d {
        return 0d;
    }
    return available;
}
