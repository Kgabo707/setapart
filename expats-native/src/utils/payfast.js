import * as WebBrowser from "expo-web-browser";

import { PAYFAST } from "../config/appConfig";

export async function openPayfastCheckout({
  merchantId = PAYFAST.merchantId,
  merchantKey = PAYFAST.merchantKey,
  amount,
  itemName,
  uid,
  notifyUrl = PAYFAST.notifyUrl,
  sandbox = PAYFAST.sandbox,
}) {
  if (!merchantId || !merchantKey) {
    throw new Error("PayFast is not configured. Add merchant credentials to .env.");
  }

  const params = new URLSearchParams({
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: "expats://payment/success",
    cancel_url: "expats://payment/cancel",
    notify_url: notifyUrl,
    m_payment_id: `premium-${uid}-${Date.now()}`,
    amount: amount.toFixed(2),
    item_name: itemName,
    subscription_type: "1",
    billing_date: new Date().toISOString().split("T")[0],
    recurring_amount: amount.toFixed(2),
    frequency: "3",
    cycles: "0",
  });

  const url = sandbox
    ? `https://sandbox.payfast.co.za/eng/process?${params}`
    : `https://www.payfast.co.za/eng/process?${params}`;

  return WebBrowser.openBrowserAsync(url);
}
