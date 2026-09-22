// wireframes.dsl `screen PaymentRequestDetail`: amount card, shareable link,
// status badge, "Back to list" -> PaymentRequests.
import { useEffect, useState, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Card, CardContent, Chip, PageContent, PageTitle, StatCard, Typography } from "@wso2/oxygen-ui";
import { merchantApi } from "../api";
import type { components } from "../generated/merchant-api";
import { capitalize } from "../format";

type PaymentRequest = components["schemas"]["PaymentRequest"];

const STATUS_COLOR: Record<string, "success" | "warning" | "default"> = {
  paid: "success",
  pending: "warning",
  expired: "default",
};

export function PaymentRequestDetailPage(): JSX.Element {
  const { paymentRequestId } = useParams<{ paymentRequestId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<PaymentRequest | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!paymentRequestId) return;
    let live = true;
    void merchantApi.GET("/me/payment-requests/{paymentRequestId}", {
      params: { path: { paymentRequestId } },
    }).then((res) => {
      if (!live) return;
      if (res.error || !res.data) {
        setNotFound(true);
        return;
      }
      setItem(res.data);
    });
    return () => {
      live = false;
    };
  }, [paymentRequestId]);

  if (notFound) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Payment request</PageTitle.Header>
        </PageTitle>
        <Typography color="text.secondary">This payment request could not be found.</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate("/payment-requests")}>
          Back to list
        </Button>
      </PageContent>
    );
  }

  return (
    <PageContent maxWidth={560}>
      <PageTitle>
        <PageTitle.Header>Payment request</PageTitle.Header>
      </PageTitle>

      {item && (
        <>
          <Box sx={{ mb: 2 }}>
            <StatCard label="Amount" value={item.amount.toLocaleString()} />
            <Typography variant="caption" color="text.secondary">
              {item.currency}
            </Typography>
          </Box>

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2">
                Shareable link: {item.paymentLinkUrl ?? `${window.location.origin}/pay/${item.id}`}
              </Typography>
              <Chip label={capitalize(item.status)} color={STATUS_COLOR[item.status] ?? "default"} size="small" />
            </CardContent>
          </Card>

          <Button variant="outlined" onClick={() => navigate("/payment-requests")}>
            Back to list
          </Button>
        </>
      )}
    </PageContent>
  );
}
