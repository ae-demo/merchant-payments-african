screen MerchantOnboarding "Register your business after first sign-in"
  navbar "Merchant Payments"
  heading "Tell us about your business"
  input "Business name"
  input "Email"
  input "Phone number"
  select "Country"
  button "Continue" primary -> Dashboard

screen Dashboard "Merchant home: balance and recent activity"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | Transactions -> Transactions | Payouts -> Payouts"
  row
    card "Available balance | 128,400 | KES"
    card "Pending | 3 | payment requests"
    card "This month | 42 | transactions"
  row
    heading "Recent transactions"
    right
    link "View all" -> Transactions
  table "Date | Amount | Method | Status"
    row "Sep 20 | 2,500 KES | Mobile Money | Successful"
    row "Sep 19 | 9,000 KES | Card | Successful"
  button "New payment request" primary -> CreatePaymentRequest

screen CreatePaymentRequest "Create a payment request for a sale"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | Transactions -> Transactions | Payouts -> Payouts"
  heading "New payment request"
  input "Amount"
  textarea "Description (optional)"
  row
    button "Cancel" -> Dashboard
    right
    button "Create" primary -> PaymentRequestDetail

screen PaymentRequestDetail "The created payment request and its shareable link"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | Transactions -> Transactions | Payouts -> Payouts"
  heading "Payment request"
  card "Amount | 2,500 | KES"
  text "Shareable link: pay.example/abc123"
  badge "Pending" warning
  button "Back to list" -> PaymentRequests

screen PaymentRequests "All payment requests the merchant has created"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | Transactions -> Transactions | Payouts -> Payouts"
  row
    heading "Payment requests"
    right
    search "Search"
    select "Status"
  table "Created | Amount | Status | Link" -> PaymentRequestDetail
    row "Sep 20 | 2,500 KES | Pending | pay.example/abc123"
    row "Sep 18 | 9,000 KES | Paid | pay.example/xyz789"

screen Transactions "History of payments collected"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | Transactions -> Transactions | Payouts -> Payouts"
  row
    heading "Transactions"
    right
    select "Status"
  table "Date | Amount | Method | Status"
    row "Sep 20 | 2,500 KES | Mobile Money | Successful"
    row "Sep 19 | 9,000 KES | Card | Successful"
    row "Sep 17 | 1,200 KES | Mobile Money | Failed"

screen Payouts "Payout requests and their status"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | Transactions -> Transactions | Payouts -> Payouts"
  row
    card "Available balance | 128,400 | KES"
    right
    button "Request payout" primary -> RequestPayout
  table "Requested | Amount | Destination | Status"
    row "Sep 15 | 50,000 KES | Bank ****1234 | Completed"
    row "Sep 10 | 20,000 KES | M-Pesa ****9876 | Processing"

screen RequestPayout "Withdraw the available balance"
  navbar "Merchant Payments"
  sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | Transactions -> Transactions | Payouts -> Payouts"
  heading "Request a payout"
  input "Amount"
  select "Destination type (Bank / Mobile money wallet)"
  input "Destination details (account or wallet number)"
  row
    button "Cancel" -> Payouts
    right
    button "Submit" primary -> Payouts

screen PaymentPage "A customer opens a merchant's payment link"
  navbar "Merchant Payments"
  heading "Pay Acme Store"
  card "Amount due | 2,500 | KES"
  select "Payment method (Mobile money / Card)"
  input "Mobile money number"
  input "Card number"
  row
    input "Expiry"
    input "CVV"
  button "Pay now" primary -> PaymentConfirmation

screen PaymentConfirmation "Result of the customer's payment"
  navbar "Merchant Payments"
  badge "Payment successful" success
  text "Your payment of 2,500 KES to Acme Store was received."
  text "Reference: TXN-88213"

flow "Onboard and collect payments"
  role "Merchant"
  description "A merchant registers their business, creates a payment request, and tracks transactions, balance and payouts"
  MerchantOnboarding
  Dashboard
  CreatePaymentRequest
  PaymentRequestDetail
  PaymentRequests
  Transactions
  Payouts
  RequestPayout

flow "Guest checkout"
  description "A customer pays a merchant's payment link as a guest"
  PaymentPage
  PaymentConfirmation
