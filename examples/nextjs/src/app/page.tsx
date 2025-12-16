"use client";
import Image from "next/image";
import { useState } from "react";
import Strata from "@connectstrata/strata-frontend-sdk";
import { AuthorizeOptions } from "../../../../dist/Strata";

const providers = [
  {
    name: "Slack",
    description: "Connect Slack to receive notifications",
    icon: "/slack-new-logo.svg",
    id: "slack",
  },
  {
    name: "Salesforce",
    description:
      "Sync leads, contacts, and campaign data directly with your Salesforce CRM.",
    icon: "/salesforce-2.svg",
    id: "salesforce",
  },
  {
    name: "Shopify",
    description: "Sync orders, customers, and product data from your Shopify store.",
    icon: "/shopify.svg",
    id: "shopify",
  },
];

export default function Home() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleConnect(providerId: string) {
    setLoading(providerId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/strata-jwt", { method: "POST" });
      const data = await res.json();
      if (!data.token) throw new Error("No token returned from API");

      const strata = new Strata();

      // Add custom parameters for specific integrations
      const options: AuthorizeOptions = {};
      if (providerId === "shopify") {
        options.customParams = { shop: "connectstrata.myshopify.com" };
        options.detectClosedAuthWindow = false;
      }

      await strata.authorize(data.token, providerId, options);
      setSuccess(`Connected to ${providerId}`);
    } catch (err: any) {
      setError(`${err.message}: ${err.code}` || "Error authorizing integration");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold mb-10 text-gray-900">
        Integrations
      </h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
        {providers.map((integration) => (
          <div
            key={integration.name}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <Image
                src={integration.icon}
                alt={integration.name + " logo"}
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="text-lg font-medium text-gray-900">
                {integration.name}
              </span>
            </div>
            <p className="text-gray-600 text-sm flex-1 mb-6">
              {integration.description}
            </p>
            <button
              className="ml-auto px-4 py-1.5 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60"
              type="button"
              disabled={loading === integration.id}
              onClick={() => handleConnect(integration.id)}
            >
              {loading === integration.id ? "Connecting..." : "Connect"}
            </button>
          </div>
        ))}
      </div>
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
