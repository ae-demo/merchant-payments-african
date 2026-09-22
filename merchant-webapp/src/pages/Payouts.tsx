// wireframes.dsl `screen Payouts`: balance card + "Request payout" -> RequestPayout,
// table Requested | Amount | Destination | Status.
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Chip, ListingTable, PageContent, PageTitle, StatCard, Typography } from "@wso2/oxygen-ui";
import { merchantApi } from "../api";
import type { components } from "../generated/merchant-api";
import { capitalize, formatAmount, formatDate, formatDestination } from "../format";

type Payout = components["schemas"]["Payout"];

const STATUS_COLOR: Record<string, "success" | "warning" | "info" | "error" | "default"> = {
  completed: "success",
  processing: "info",
  pending: "warning",
  failed: "error",
};

export function PayoutsPage(): JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<Payout[]>([]);
  const [balance, setBalance] = useState<{ available: number; currency: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    void Promise.all([
      merchantApi.GET("/me/payouts", { params: { query: { limit: 50 } } }),
      merchantApi.GET("/me/balance"),
    ]).then(([payoutsRes, balanceRes]) => {
      if (!live) return;
      setItems(payoutsRes.data?.data ?? []);
      if (balanceRes.data) setBalance(balanceRes.data);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payouts</PageTitle.Header>
        <PageTitle.SubHeader>Payout requests and their status</PageTitle.SubHeader>
        <PageTitle.Actions>
          <Button variant="contained" onClick={() => navigate("/payouts/new")}>
            Request payout
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      <Box sx={{ mb: 3 }}>
        <StatCard label="Available balance" value={balance ? balance.available.toLocaleString() : "—"} />
        {balance && (
          <Typography variant="caption" color="text.secondary">
            {balance.currency}
          </Typography>
        )}
      </Box>

      <Card>
        <CardContent>
          <ListingTable.Container disablePaper>
            <ListingTable>
              <ListingTable.Head>
                <ListingTable.Row>
                  <ListingTable.Cell>Requested</ListingTable.Cell>
                  <ListingTable.Cell>Amount</ListingTable.Cell>
                  <ListingTable.Cell>Destination</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {!loading && items.length === 0 ? (
                  <ListingTable.Row>
                    <ListingTable.Cell colSpan={4}>
                      <ListingTable.EmptyState title="No payouts requested yet" />
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ) : (
                  items.map((p) => (
                    <ListingTable.Row key={p.id}>
                      <ListingTable.Cell>{formatDate(p.requestedAt)}</ListingTable.Cell>
                      <ListingTable.Cell>{formatAmount(p.amount, p.currency)}</ListingTable.Cell>
                      <ListingTable.Cell>{formatDestination(p.destinationType, p.destinationDetails)}</ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip label={capitalize(p.status)} color={STATUS_COLOR[p.status] ?? "default"} size="small" />
                      </ListingTable.Cell>
                    </ListingTable.Row>
                  ))
                )}
              </ListingTable.Body>
            </ListingTable>
          </ListingTable.Container>
        </CardContent>
      </Card>
    </PageContent>
  );
}
