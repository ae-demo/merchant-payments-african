// wireframes.dsl `screen PaymentPage` — public, F2 "Guest checkout": amount
// due card, payment method select, mobile money / card fields, "Pay now"
// (primary) -> PaymentConfirmation. GET /payment-links/{paymentRequestId} and
// POST /payment-links/{paymentRequestId}/pay are both `security: []` — no
// auth gating, no assertion read (thunder-authentication: a public operation
// has no policy).
import { useEffect, useState, type FormEvent, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Form,
  MenuItem,
  PageContent,
  PageTitle,
  Stack,
  StatCard,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { merchantApi } from "../api";
import type { components } from "../generated/merchant-api";
import { PublicPageFrame } from "../shell/PublicHeader";

type PaymentLink = components["schemas"]["PaymentLink"];
type Method = components["schemas"]["PaymentInput"]["method"];

export function PaymentPage(): JSX.Element {
  const { paymentRequestId } = useParams<{ paymentRequestId: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [method, setMethod] = useState<Method>("mobile_money");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentRequestId) return;
    let live = true;
    void merchantApi
      .GET("/payment-links/{paymentRequestId}", { params: { path: { paymentRequestId } } })
      .then((res) => {
        if (!live) return;
        if (res.error || !res.data) {
          setNotFound(true);
          return;
        }
        setLink(res.data);
      });
    return () => {
      live = false;
    };
  }, [paymentRequestId]);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!paymentRequestId) return;
    setError(null);
    if (method === "mobile_money" && !mobileMoneyNumber.trim()) {
      setError("Enter your mobile money number.");
      return;
    }
    if (method === "card" && (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim())) {
      setError("Fill in every card field.");
      return;
    }
    setSubmitting(true);
    const res = await merchantApi.POST("/payment-links/{paymentRequestId}/pay", {
      params: { path: { paymentRequestId } },
      body:
        method === "mobile_money"
          ? { method, mobileMoneyNumber }
          : { method, cardNumber, cardExpiry, cardCvv },
    });
    setSubmitting(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "The payment could not be completed. Try again.");
      return;
    }
    navigate(`/pay/${paymentRequestId}/confirmation`, { state: { transaction: res.data, link } });
  }

  if (notFound) {
    return (
      <PublicPageFrame>
        <PageContent maxWidth={480}>
          <PageTitle>
            <PageTitle.Header>Payment link not found</PageTitle.Header>
          </PageTitle>
          <Typography color="text.secondary">
            This payment link is invalid or has expired. Ask the merchant for a new one.
          </Typography>
        </PageContent>
      </PublicPageFrame>
    );
  }

  return (
    <PublicPageFrame>
      <PageContent maxWidth={480}>
        <PageTitle>
          <PageTitle.Header>{link ? `Pay ${link.businessName}` : "Pay"}</PageTitle.Header>
        </PageTitle>

        {link && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <StatCard label="Amount due" value={link.amount.toLocaleString()} />
              <Typography variant="caption" color="text.secondary">
                {link.currency}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Form.Section>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <Form.Stack spacing={3}>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                select
                label="Payment method (Mobile money / Card)"
                value={method}
                onChange={(e) => setMethod(e.target.value as Method)}
              >
                <MenuItem value="mobile_money">Mobile money</MenuItem>
                <MenuItem value="card">Card</MenuItem>
              </TextField>

              {method === "mobile_money" ? (
                <TextField
                  label="Mobile money number"
                  value={mobileMoneyNumber}
                  onChange={(e) => setMobileMoneyNumber(e.target.value)}
                  required
                />
              ) : (
                <>
                  <TextField
                    label="Card number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Expiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                      fullWidth
                    />
                    <TextField
                      label="CVV"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                      fullWidth
                    />
                  </Box>
                </>
              )}

              <Stack direction="row" justifyContent="flex-end">
                <Button type="submit" variant="contained" disabled={submitting || !link}>
                  Pay now
                </Button>
              </Stack>
            </Form.Stack>
          </form>
        </Form.Section>
      </PageContent>
    </PublicPageFrame>
  );
}
