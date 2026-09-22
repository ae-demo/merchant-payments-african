// wireframes.dsl `screen Dashboard`: balance + pending + this-month stat cards,
// a recent-transactions table, "View all" -> Transactions, "New payment
// request" -> CreatePaymentRequest. On entry it also checks GET /me/merchant:
// a 404 means the caller has not registered a business yet, so it redirects
// to MerchantOnboarding (note 3) — a runtime fact, not a scope, so it cannot
// live in src/authz/screens.ts.
import { useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid,
  PageContent,
  PageTitle,
  StatCard,
  Chip,
  Button,
  ListingTable,
  Typography,
} from "@wso2/oxygen-ui";
import { merchantApi } from "../api";
import type { components } from "../generated/merchant-api";
import { formatAmount, formatDate, formatMethod, capitalize } from "../format";

type Transaction = components["schemas"]["Transaction"];

const LAST_SEEN_KEY = "merchant-webapp:lastSeenPaidAt";

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  successful: "success",
  pending: "warning",
  failed: "error",
};

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<{ available: number; currency: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [newlyPaid, setNewlyPaid] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const merchant = await merchantApi.GET("/me/merchant");
      if (!live) return;
      if (merchant.response.status === 404 || merchant.error) {
        navigate("/onboarding", { replace: true });
        return;
      }

      const [balanceRes, pendingRes, txRes] = await Promise.all([
        merchantApi.GET("/me/balance"),
        merchantApi.GET("/me/payment-requests", { params: { query: { status: "pending", limit: 1 } } }),
        merchantApi.GET("/me/transactions", { params: { query: { limit: 100 } } }),
      ]);
      if (!live) return;

      if (balanceRes.data) setBalance(balanceRes.data);
      if (pendingRes.data) setPendingCount(pendingRes.data.count);

      const transactions = txRes.data?.data ?? [];
      const now = new Date();
      const thisMonth = transactions.filter((t) => {
        const d = new Date(t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      setMonthCount(thisMonth.length);
      setRecent(transactions.slice(0, 5));

      const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY) ?? "0");
      const latestPaid = transactions
        .filter((t) => t.status === "successful")
        .reduce((max, t) => Math.max(max, new Date(t.createdAt).getTime()), 0);
      if (latestPaid > lastSeen) setNewlyPaid(true);

      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [navigate]);

  function dismissNotification(): void {
    setNewlyPaid(false);
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  }

  if (loading) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>Dashboard</PageTitle.Header>
        </PageTitle>
        <Typography color="text.secondary">Loading…</Typography>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Dashboard</PageTitle.Header>
        <PageTitle.SubHeader>Balance and recent activity</PageTitle.SubHeader>
        <PageTitle.Actions>
          <Button variant="contained" onClick={() => navigate("/payment-requests/new")}>
            New payment request
          </Button>
        </PageTitle.Actions>
      </PageTitle>

      {newlyPaid && (
        <Alert severity="success" onClose={dismissNotification} sx={{ mb: 3 }}>
          A payment request was just paid — check Transactions for the details.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard
            label="Available balance"
            value={balance ? balance.available.toLocaleString() : "—"}
            iconColor="primary"
          />
          {balance && (
            <Typography variant="caption" color="text.secondary">
              {balance.currency}
            </Typography>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard label="Pending" value={pendingCount} iconColor="warning" />
          <Typography variant="caption" color="text.secondary">
            payment requests
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard label="This month" value={monthCount} iconColor="info" />
          <Typography variant="caption" color="text.secondary">
            transactions
          </Typography>
        </Grid>
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6">Recent transactions</Typography>
        <Button variant="text" onClick={() => navigate("/transactions")}>
          View all
        </Button>
      </Box>

      <Card>
        <CardContent>
          <ListingTable.Container disablePaper>
            <ListingTable>
              <ListingTable.Head>
                <ListingTable.Row>
                  <ListingTable.Cell>Date</ListingTable.Cell>
                  <ListingTable.Cell>Amount</ListingTable.Cell>
                  <ListingTable.Cell>Method</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {recent.length === 0 ? (
                  <ListingTable.Row>
                    <ListingTable.Cell colSpan={4}>
                      <ListingTable.EmptyState title="No transactions yet" />
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ) : (
                  recent.map((t) => (
                    <ListingTable.Row key={t.id}>
                      <ListingTable.Cell>{formatDate(t.createdAt)}</ListingTable.Cell>
                      <ListingTable.Cell>{formatAmount(t.amount, t.currency)}</ListingTable.Cell>
                      <ListingTable.Cell>{formatMethod(t.method)}</ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip
                          label={capitalize(t.status)}
                          color={STATUS_COLOR[t.status] ?? "default"}
                          size="small"
                        />
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
