// wireframes.dsl `screen RequestPayout`: amount, destination type select,
// destination details, Cancel -> Payouts, Submit (primary) -> Payouts.
import { useState, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, MenuItem, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { merchantApi } from "../api";
import type { components } from "../generated/merchant-api";

type DestinationType = components["schemas"]["PayoutInput"]["destinationType"];

export function RequestPayoutPage(): JSX.Element {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [destinationType, setDestinationType] = useState<DestinationType>("bank");
  const [destinationDetails, setDestinationDetails] = useState("");
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
    if (!destinationDetails.trim()) {
      setError("Enter the destination account or wallet number.");
      return;
    }
    setSubmitting(true);
    const res = await merchantApi.POST("/me/payouts", {
      body: { amount: parsedAmount, destinationType, destinationDetails },
    });
    setSubmitting(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not request the payout.");
      return;
    }
    navigate("/payouts");
  }

  return (
    <PageContent maxWidth={560}>
      <PageTitle>
        <PageTitle.Header>Request a payout</PageTitle.Header>
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
              select
              label="Destination type (Bank / Mobile money wallet)"
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value as DestinationType)}
            >
              <MenuItem value="bank">Bank</MenuItem>
              <MenuItem value="mobile_wallet">Mobile money wallet</MenuItem>
            </TextField>
            <TextField
              label="Destination details (account or wallet number)"
              value={destinationDetails}
              onChange={(e) => setDestinationDetails(e.target.value)}
              required
            />
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" onClick={() => navigate("/payouts")} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={submitting}>
                Submit
              </Button>
            </Stack>
          </Form.Stack>
        </form>
      </Form.Section>
    </PageContent>
  );
}
