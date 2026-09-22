// wireframes.dsl `screen PaymentRequests`: search + status select, table
// Created | Amount | Status | Link, rows clickable -> PaymentRequestDetail.
import { useEffect, useMemo, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  ListingTable,
  MenuItem,
  PageContent,
  PageTitle,
  SearchBar,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { merchantApi } from "../api";
import type { components } from "../generated/merchant-api";
import { capitalize, formatAmount, formatDate } from "../format";

type PaymentRequest = components["schemas"]["PaymentRequest"];

const STATUS_COLOR: Record<string, "success" | "warning" | "default"> = {
  paid: "success",
  pending: "warning",
  expired: "default",
};

const STATUS_OPTIONS = ["", "pending", "paid", "expired"] as const;

export function PaymentRequestsPage(): JSX.Element {
  const navigate = useNavigate();
  const [items, setItems] = useState<PaymentRequest[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    void merchantApi
      .GET("/me/payment-requests", {
        params: { query: { limit: 50, ...(status ? { status } : {}) } },
      })
      .then((res) => {
        if (!live) return;
        setItems(res.data?.data ?? []);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.id.toLowerCase().includes(q) || (item.description ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Payment requests</PageTitle.Header>
      </PageTitle>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 2 }}>
        <SearchBar
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
          sx={{ minWidth: 160 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option === "" ? "All" : capitalize(option)}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Card>
        <CardContent>
          <ListingTable.Container disablePaper>
            <ListingTable>
              <ListingTable.Head>
                <ListingTable.Row>
                  <ListingTable.Cell>Created</ListingTable.Cell>
                  <ListingTable.Cell>Amount</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                  <ListingTable.Cell>Link</ListingTable.Cell>
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {!loading && filtered.length === 0 ? (
                  <ListingTable.Row>
                    <ListingTable.Cell colSpan={4}>
                      <ListingTable.EmptyState title="No payment requests yet" />
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ) : (
                  filtered.map((item) => (
                    <ListingTable.Row
                      key={item.id}
                      clickable
                      onClick={() => navigate(`/payment-requests/${item.id}`)}
                    >
                      <ListingTable.Cell>{formatDate(item.createdAt)}</ListingTable.Cell>
                      <ListingTable.Cell>{formatAmount(item.amount, item.currency)}</ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip
                          label={capitalize(item.status)}
                          color={STATUS_COLOR[item.status] ?? "default"}
                          size="small"
                        />
                      </ListingTable.Cell>
                      <ListingTable.Cell truncate maxWidth={220}>
                        <Typography variant="body2" color="text.secondary">
                          {item.paymentLinkUrl ?? "—"}
                        </Typography>
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
