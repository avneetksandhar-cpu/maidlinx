import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import {
  formatAddress,
  formatBookingDate,
  formatBookingTotal,
  getServiceLabel,
} from "@/lib/dashboard/display";

interface InvoiceListProps {
  invoices: DashboardBooking[];
}

export function InvoiceList({ invoices }: InvoiceListProps) {
  if (invoices.length === 0) return null;

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <Card key={invoice.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-medium text-ink">{invoice.invoiceNumber}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {getServiceLabel(invoice.serviceType)} · {formatBookingDate(invoice.scheduledAt)}
              </p>
              <p className="mt-0.5 text-sm text-ink-subtle">
                {formatAddress(invoice.addressLine1, invoice.addressCity, invoice.addressState)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={invoice.status} />
              <p className="font-medium text-ink">
                {formatBookingTotal(invoice.totalCents, invoice.currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ReceiptListProps {
  receipts: DashboardBooking[];
}

export function ReceiptList({ receipts }: ReceiptListProps) {
  if (receipts.length === 0) return null;

  return (
    <div className="space-y-3">
      {receipts.map((receipt) => (
        <Card key={receipt.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-medium text-ink">{getServiceLabel(receipt.serviceType)}</p>
              <p className="mt-1 text-sm text-ink-muted">{formatBookingDate(receipt.scheduledAt)}</p>
              <p className="mt-0.5 font-medium text-ink">
                {formatBookingTotal(receipt.totalCents, receipt.currency)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {receipt.stripeReceiptUrl ? (
                <Link
                  href={receipt.stripeReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Download receipt
                </Link>
              ) : (
                <span className="text-sm text-ink-muted">Receipt pending</span>
              )}
              {receipt.invoiceNumber && (
                <span className="font-mono text-xs text-ink-subtle">{receipt.invoiceNumber}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
