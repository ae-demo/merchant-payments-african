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
