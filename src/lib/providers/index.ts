import { registerProvider } from "./registry";
import { VibeProspectingProvider } from "./vibe";
import { ApolloProvider } from "./apollo";
import { HunterProvider } from "./hunter";
import { ApifyProvider } from "./apify";
import { GenericRESTProvider } from "./generic-rest";
import { CSVProvider } from "./csv";
import { JSONProvider } from "./json";
import { DatabaseProvider } from "./database";

export function registerAllProviders() {
  registerProvider("vibe_prospecting", VibeProspectingProvider as any);
  registerProvider("apollo", ApolloProvider as any);
  registerProvider("hunter", HunterProvider as any);
  registerProvider("apify", ApifyProvider as any);
  registerProvider("generic_rest", GenericRESTProvider as any);
  registerProvider("csv", CSVProvider as any);
  registerProvider("json", JSONProvider as any);
  registerProvider("database", DatabaseProvider as any);
}
