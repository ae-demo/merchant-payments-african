// wireframes.dsl `screen CreatePaymentRequest`: amount + optional description,
// Cancel -> Dashboard, Create (primary) -> PaymentRequestDetail.
import { useState, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { merchantApi } from "../api";

export function CreatePaymentRequestPage(): JSX.Element {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    setSubmitting(true);
    const res = await merchantApi.POST("/me/payment-requests", {
      body: { amount: parsedAmount, description: description || undefined },
    });
    setSubmitting(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not create the payment request.");
      return;
    }
    navigate(`/payment-requests/${res.data.id}`);
  }

  return (
    <PageContent maxWidth={560}>
      <PageTitle>
        <PageTitle.Header>New payment request</PageTitle.Header>
      </PageTitle>

      <Form.Section>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <Form.Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              inputProps={{ min: 0, step: "0.01" }}
            />
            <TextField
              label="Description (optional)"
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" onClick={() => navigate("/dashboard")} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                Create
              </Button>
            </Stack>
          </Form.Stack>
        </form>
      </Form.Section>
    </PageContent>
  );
}
