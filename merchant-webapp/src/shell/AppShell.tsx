// The signed-in app chrome — the sample app's AppLayout shape
// (oxygen-ui-design-system references/app-structure.md): Header in
// AppShell.Navbar, Sidebar in AppShell.Sidebar, the routed screen in
// AppShell.Main, Footer in AppShell.Footer. Every gated screen renders inside
// this, via <Outlet/>. The rail mirrors wireframes.dsl's
// `sidebar "Dashboard -> Dashboard | Payment requests -> PaymentRequests | ...`
// line, repeated on every F1 screen — one rail, each item gated with <Can>.
import type { JSX } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  ColorSchemeToggle,
  Divider,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import { LayoutDashboard, FileText, Receipt, Wallet, LogOut } from "@wso2/oxygen-ui-icons-react";
import { Can, useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";
import { APP_NAME } from "../appName";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard />, op: "GET /me/transactions" as const },
  {
    id: "payment-requests",
    label: "Payment requests",
    path: "/payment-requests",
    icon: <FileText />,
    op: "GET /me/payment-requests" as const,
  },
  {
    id: "transactions",
    label: "Transactions",
    path: "/transactions",
    icon: <Receipt />,
    op: "GET /me/transactions" as const,
  },
  { id: "payouts", label: "Payouts", path: "/payouts", icon: <Wallet />, op: "GET /me/payouts" as const },
];

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { username } = useAuthz();
  const active = NAV_ITEMS.find((item) => pathname.startsWith(item.path))?.id;

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand onClick={() => navigate("/dashboard")}>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Merchant"} />
              <UserMenu.Header name={username || "Merchant"} email={username} />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {NAV_ITEMS.map((item) => (
                <Can key={item.id} op={item.op}>
                  <Sidebar.Item id={item.id} link={<Link to={item.path} />}>
                    <Sidebar.ItemIcon>{item.icon}</Sidebar.ItemIcon>
                    <Sidebar.ItemLabel>{item.label}</Sidebar.ItemLabel>
                  </Sidebar.Item>
                </Can>
              ))}
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
