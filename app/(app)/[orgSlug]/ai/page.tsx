import { AiAgentPage } from "@/components/ai/ai-agent-page";

/** AI agent workspace — Track D. Pro/Enterprise plans only. */
export default function Page({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return <AiAgentPage initialQuery={searchParams.q} />;
}
