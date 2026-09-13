"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";

type ProviderStatus = "connected" | "disconnected" | "pending" | "error";

interface ProviderCard {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ProviderStatus;
  capabilities: string[];
}

const PROVIDERS: ProviderCard[] = [
  { id: "vibe_prospecting", name: "Vibe Prospecting", category: "Data", description: "Companies, contacts, research, and intent signals.", status: "disconnected", capabilities: ["company_search", "contact_search", "company_research", "contact_enrichment", "events", "export"] },
  { id: "apollo", name: "Apollo", category: "Data", description: "Company and contact search with enrichment.", status: "disconnected", capabilities: ["company_search", "contact_search", "enrichment"] },
  { id: "hunter", name: "Hunter", category: "Enrichment", description: "Email finder and verifier.", status: "disconnected", capabilities: ["email_search", "email_verification"] },
  { id: "apify", name: "Apify", category: "Data", description: "Web scraping and website data extraction.", status: "disconnected", capabilities: ["web_scraping", "website_data", "company_discovery"] },
  { id: "generic_rest", name: "Custom REST API", category: "Data", description: "Bring your own API endpoint.", status: "disconnected", capabilities: ["custom"] },
  { id: "csv", name: "CSV Import", category: "Import", description: "Import companies and contacts from CSV.", status: "connected", capabilities: ["import"] },
  { id: "json", name: "JSON Import", category: "Import", description: "Import datasets from JSON.", status: "connected", capabilities: ["import"] },
];

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const provider = selected ? PROVIDERS.find((p) => p.id === selected) : null;

  return (
    <div className="space-y-4">
      <PageHeader title="Integrations" subtitle="Data, AI, email, and messaging providers." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelected(item.id)}
            className={`text-left bg-white dark:bg-black border rounded-xl p-4 transition-colors ${
              selected === item.id ? "border-gray-900 dark:border-gray-100" : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 mt-1">{item.category}</div>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                item.status === "connected" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
              }`}>
                {item.status === "connected" ? "Connected" : "Not connected"}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {item.capabilities.slice(0, 3).map((cap) => (
                <span key={cap} className="rounded-md border border-gray-200 dark:border-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">{cap}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {provider && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{provider.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{provider.description}</p>
            </div>
            {provider.status === "connected" ? (
              <div className="flex gap-2">
                <button className="rounded-md border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900">Configure</button>
                <button className="rounded-md border border-red-200 dark:border-red-900 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950">Disconnect</button>
              </div>
            ) : (
              <button className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 text-sm font-medium">Connect {provider.name}</button>
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-sm font-medium mt-1">{provider.status === "connected" ? "Connected" : "Not connected"}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500">Capabilities</div>
              <div className="text-sm font-medium mt-1">{provider.capabilities.length} detected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
