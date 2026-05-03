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
import { SpoilingItem } from "../lib/getSpoilingItems";

interface SpoilageAlertProps {
  displayName: string | null;
  items: SpoilingItem[];
  appUrl: string;
}

export const SpoilageAlert = ({
  displayName = "there",
  items = [],
  appUrl = "http://localhost:3000",
}: SpoilageAlertProps) => {
  const previewText = `🍌 Use these today — ${items.length} items expire tomorrow!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Smart Pantry</Heading>
          <Text style={text}>Hi {displayName},</Text>
          <Text style={text}>
            You have <strong>{items.length}</strong> items in your pantry that are expiring tomorrow. 
            Try to use them today to prevent food waste!
          </Text>

          <Section style={tableContainer}>
            <Row style={tableHeaderRow}>
              <Column style={tableHeader}>Item Name</Column>
              <Column style={tableHeader}>Storage</Column>
              <Column style={tableHeader}>Quantity</Column>
            </Row>
            {items.map((item) => (
              <Row key={item.id} style={tableRow}>
                <Column style={tableCell}>
                  <strong>{item.name}</strong>
                </Column>
                <Column style={tableCell}>
                  <span style={getStoragePillStyle(item.storage_type)}>
                    {item.storage_type}
                  </span>
                </Column>
                <Column style={tableCell}>{item.quantity}</Column>
              </Row>
            ))}
          </Section>

          <Section style={btnContainer}>
            <Button style={button} href={`${appUrl}/dashboard`}>
              Open Dashboard →
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you have items expiring in your Smart Pantry.
            <br />
            &copy; 2026 Smart Pantry. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SpoilageAlert;

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
  color: "#16a34a", // green-600
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
      return { ...base, backgroundColor: "#dbeafe", color: "#1d4ed8" }; // blue
    case "freezer":
      return { ...base, backgroundColor: "#e0e7ff", color: "#4338ca" }; // indigo
    case "pantry":
      return { ...base, backgroundColor: "#fef3c7", color: "#b45309" }; // amber
    default:
      return { ...base, backgroundColor: "#f3f4f6", color: "#4b5563" }; // gray
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
