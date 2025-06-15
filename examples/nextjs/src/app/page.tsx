"use client";
import Image from "next/image";
import { useState } from "react";
import Strata from "@connectstrata/frontend-sdk";

const integrations = [
  {
    name: "Slack",
    description: "Connect Slack to receive notifications",
    icon: "/slack-new-logo.svg",
    key: "slack",
  },
  {
    name: "Salesforce",
    description:
      "Sync leads, contacts, and campaign data directly with your Salesforce CRM.",
    icon: "/salesforce-2.svg",
    key: "salesforce",
  },
];

const PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || "demo_project_id";

export default function Home() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleConnect(integrationKey: string) {
    setLoading(integrationKey);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/strata-jwt", { method: "POST" });
      const data = await res.json();
      if (!data.token) throw new Error("No token returned from API");

      const strata = new Strata();
      await strata.authorize(PROJECT_ID, data.token, integrationKey);
      setSuccess(`Connected to ${integrationKey}`);
    } catch (err: any) {
      setError(err.message || "Error authorizing integration");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold mb-10 text-gray-900">
        Integrations
      </h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {integrations.map((integration) => (
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
              disabled={loading === integration.key}
              onClick={() => handleConnect(integration.key)}
            >
              {loading === integration.key ? "Connecting..." : "Connect"}
            </button>
            {error && loading === null && (
              <div className="text-red-600 text-xs mt-2">{error}</div>
            )}
            {success && loading === null && (
              <div className="text-green-600 text-xs mt-2">{success}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
