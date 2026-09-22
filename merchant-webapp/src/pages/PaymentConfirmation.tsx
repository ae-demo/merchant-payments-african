// wireframes.dsl `screen PaymentConfirmation` — public, F2 "Guest checkout":
// success/failure badge, amount + merchant text, transaction reference.
// Reached only by navigating from PaymentPage after POST
// /payment-links/{id}/pay; the result rides router state rather than a
// second load call, since this screen has `loads: null` (nothing to fetch —
// the transaction was already returned by the pay call).
import type { JSX } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Chip, PageContent, PageTitle, Stack, Typography } from "@wso2/oxygen-ui";
import type { components } from "../generated/merchant-api";
import { PublicPageFrame } from "../shell/PublicHeader";
import { formatAmount } from "../format";

type Transaction = components["schemas"]["Transaction"];
type PaymentLink = components["schemas"]["PaymentLink"];
type ConfirmationState = { transaction?: Transaction; link?: PaymentLink | null };

export function PaymentConfirmationPage(): JSX.Element {
  const { paymentRequestId } = useParams<{ paymentRequestId: string }>();
  const navigate = useNavigate();
  const { transaction, link } = (useLocation().state ?? {}) as ConfirmationState;

  if (!transaction) {
    return (
      <PublicPageFrame>
        <PageContent maxWidth={480}>
          <PageTitle>
            <PageTitle.Header>No confirmation to show</PageTitle.Header>
          </PageTitle>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Open your payment link again to pay or check the result.
          </Typography>
          {paymentRequestId && (
            <Button variant="contained" onClick={() => navigate(`/pay/${paymentRequestId}`)}>
              Back to payment
            </Button>
          )}
        </PageContent>
      </PublicPageFrame>
    );
  }

  const succeeded = transaction.status === "successful";

  return (
    <PublicPageFrame>
      <PageContent maxWidth={480}>
        <PageTitle>
          <PageTitle.Header>Payment {succeeded ? "confirmation" : "failed"}</PageTitle.Header>
        </PageTitle>

        <Stack spacing={2}>
          <Chip
            label={succeeded ? "Payment successful" : "Payment failed"}
            color={succeeded ? "success" : "error"}
            sx={{ alignSelf: "flex-start", fontSize: "1rem", py: 2.5, px: 1 }}
          />
          <Typography variant="body1">
            {succeeded
              ? `Your payment of ${formatAmount(transaction.amount, transaction.currency)}${
                  link ? ` to ${link.businessName}` : ""
                } was received.`
              : `Your payment of ${formatAmount(transaction.amount, transaction.currency)} could not be completed.`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reference: {transaction.gatewayReference ?? transaction.id}
          </Typography>
          {!succeeded && paymentRequestId && (
            <Button variant="contained" onClick={() => navigate(`/pay/${paymentRequestId}`)} sx={{ alignSelf: "flex-start" }}>
              Try again
            </Button>
          )}
        </Stack>
      </PageContent>
    </PublicPageFrame>
  );
}
