// wireframes.dsl `screen Transactions`: status select, table
// Date | Amount | Method | Status. No row navigation target.
import { useEffect, useState, type JSX } from "react";
import { Box, Card, CardContent, Chip, ListingTable, MenuItem, PageContent, PageTitle, TextField } from "@wso2/oxygen-ui";
import { merchantApi } from "../api";
import type { components } from "../generated/merchant-api";
import { capitalize, formatAmount, formatDate, formatMethod } from "../format";

type Transaction = components["schemas"]["Transaction"];

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  successful: "success",
  pending: "warning",
  failed: "error",
};

const STATUS_OPTIONS = ["", "pending", "successful", "failed"] as const;

export function TransactionsPage(): JSX.Element {
  const [items, setItems] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    void merchantApi
      .GET("/me/transactions", { params: { query: { limit: 50, ...(status ? { status } : {}) } } })
      .then((res) => {
        if (!live) return;
        setItems(res.data?.data ?? []);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [status]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>Transactions</PageTitle.Header>
      </PageTitle>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
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
                  <ListingTable.Cell>Date</ListingTable.Cell>
                  <ListingTable.Cell>Amount</ListingTable.Cell>
                  <ListingTable.Cell>Method</ListingTable.Cell>
                  <ListingTable.Cell>Status</ListingTable.Cell>
                </ListingTable.Row>
              </ListingTable.Head>
              <ListingTable.Body>
                {!loading && items.length === 0 ? (
                  <ListingTable.Row>
                    <ListingTable.Cell colSpan={4}>
                      <ListingTable.EmptyState title="No transactions yet" />
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ) : (
                  items.map((t) => (
                    <ListingTable.Row key={t.id}>
                      <ListingTable.Cell>{formatDate(t.createdAt)}</ListingTable.Cell>
                      <ListingTable.Cell>{formatAmount(t.amount, t.currency)}</ListingTable.Cell>
                      <ListingTable.Cell>{formatMethod(t.method)}</ListingTable.Cell>
                      <ListingTable.Cell>
                        <Chip label={capitalize(t.status)} color={STATUS_COLOR[t.status] ?? "default"} size="small" />
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
