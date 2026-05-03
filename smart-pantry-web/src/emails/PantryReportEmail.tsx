import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";

export type PantryReportItem = {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  storage_type?: string;
  expiry_date?: string | null;
};

export type ReportType = "pantry" | "expiring";

interface PantryReportEmailProps {
  displayName: string | null;
  items: PantryReportItem[];
  reportType: ReportType;
  expiringDays?: number;
  appUrl: string;
}

export const PantryReportEmail = ({
  displayName = "there",
  items = [],
  reportType = "pantry",
  expiringDays = 3,
  appUrl = "http://localhost:3000",
}: PantryReportEmailProps) => {
  const isPantry = reportType === "pantry";
  const previewText = isPantry
    ? `📦 Your Smart Pantry — ${items.length} items currently in stock`
    : `⚠️ ${items.length} items expiring within ${expiringDays} day${expiringDays === 1 ? "" : "s"}`;

  const subject = isPantry ? "Your Pantry List" : `Items Expiring Soon (${expiringDays}d)`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Smart Pantry</Heading>
          <Text style={text}>Hi {displayName},</Text>
          <Text style={text}>
            {isPantry ? (
              <>
                Here is a snapshot of your current pantry. You have{" "}
                <strong>{items.length}</strong> item{items.length !== 1 ? "s" : ""} in stock.
              </>
            ) : (
              <>
                The following <strong>{items.length}</strong> item{items.length !== 1 ? "s" : ""}{" "}
                {items.length === 1 ? "is" : "are"} expiring within the next{" "}
                <strong>{expiringDays}</strong> day{expiringDays === 1 ? "" : "s"}. Try to use them
                before they go to waste!
              </>
            )}
          </Text>

          {items.length === 0 ? (
            <Text style={{ ...text, color: "#6b7280", fontStyle: "italic" }}>
              {isPantry ? "Your pantry is currently empty." : "No items expiring in this window. 🎉"}
            </Text>
          ) : (
            <Section style={tableContainer}>
              <Row style={tableHeaderRow}>
                <Column style={tableHeader}>Item</Column>
                <Column style={tableHeader}>Category</Column>
                <Column style={tableHeader}>Storage</Column>
                <Column style={tableHeader}>Qty</Column>
                {!isPantry && <Column style={tableHeader}>Expires</Column>}
              </Row>
              {items.map((item) => (
                <Row key={item.id} style={tableRow}>
                  <Column style={tableCell}>
                    <strong>{item.name}</strong>
                  </Column>
                  <Column style={tableCell}>{item.category ?? "—"}</Column>
                  <Column style={tableCell}>
                    {item.storage_type ? (
                      <span style={getStoragePillStyle(item.storage_type)}>{item.storage_type}</span>
                    ) : (
                      "—"
                    )}
                  </Column>
                  <Column style={tableCell}>{item.quantity}</Column>
                  {!isPantry && (
                    <Column style={{ ...tableCell, color: "#dc2626", fontWeight: "bold" }}>
                      {item.expiry_date ?? "Unknown"}
                    </Column>
                  )}
                </Row>
              ))}
            </Section>
          )}

          <Section style={btnContainer}>
            <Button style={button} href={`${appUrl}/dashboard`}>
              Open Dashboard →
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            This report was sent at your request from Smart Pantry.
            <br />
            © 2026 Smart Pantry. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PantryReportEmail;

// --- Styles ---

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const h1 = {
  color: "#16a34a",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  padding: "0 24px",
};

const tableContainer = {
  margin: "24px",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
};

const tableHeaderRow = {
  backgroundColor: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const tableHeader = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase" as const,
  padding: "12px 16px",
  textAlign: "left" as const,
};

const tableRow = {
  borderBottom: "1px solid #e5e7eb",
};

const tableCell = {
  color: "#374151",
  fontSize: "14px",
  padding: "12px 16px",
};

const getStoragePillStyle = (storageType: string) => {
  const base = {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "9999px",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "capitalize" as const,
  };
  switch (storageType) {
    case "fridge":
      return { ...base, backgroundColor: "#dbeafe", color: "#1d4ed8" };
    case "freezer":
      return { ...base, backgroundColor: "#e0e7ff", color: "#4338ca" };
    case "pantry":
      return { ...base, backgroundColor: "#fef3c7", color: "#b45309" };
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#4b5563" };
  }
};

const btnContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
};

const button = {
  backgroundColor: "#16a34a",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "bold",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0 24px",
};
