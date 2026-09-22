// wireframes.dsl `screen MerchantOnboarding`: business name, email, phone,
// country, Continue (primary) -> Dashboard.
import { useState, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form, MenuItem, PageContent, PageTitle, TextField } from "@wso2/oxygen-ui";
import { merchantApi } from "../api";

// ISO country codes the merchant-api currency derivation supports for this
// market — the design does not enumerate a fixed list, so this is a
// reasonable East/Southern African set matching the flows' KES examples.
const COUNTRIES = [
  { code: "KE", label: "Kenya" },
  { code: "UG", label: "Uganda" },
  { code: "TZ", label: "Tanzania" },
  { code: "NG", label: "Nigeria" },
  { code: "GH", label: "Ghana" },
  { code: "ZA", label: "South Africa" },
];

export function MerchantOnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    if (!businessName.trim() || !email.trim() || !phone.trim() || !country) {
      setError("Fill in every field to continue.");
      return;
    }
    setSubmitting(true);
    const res = await merchantApi.POST("/me/merchant", {
      body: { businessName, email, phone, country },
    });
    setSubmitting(false);
    if (res.error || !res.data) {
      setError(res.error?.message ?? "Could not register your business.");
      return;
    }
    navigate("/dashboard", { replace: true });
  }

  return (
    <PageContent maxWidth={560}>
      <PageTitle>
        <PageTitle.Header>Tell us about your business</PageTitle.Header>
        <PageTitle.SubHeader>Register your business after first sign-in</PageTitle.SubHeader>
      </PageTitle>

      <Form.Section>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <Form.Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <TextField select label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required>
              {COUNTRIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" disabled={submitting}>
              Continue
            </Button>
          </Form.Stack>
        </form>
      </Form.Section>
    </PageContent>
  );
}
