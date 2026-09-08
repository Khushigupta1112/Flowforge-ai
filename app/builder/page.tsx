import { Suspense } from "react";
import { WorkflowProvider } from "@/components/workflow/WorkflowContext";
import { BuilderClient } from "@/components/workflow/BuilderClient";

export const metadata = {
  title: "Builder — FlowForge AI",
};

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; run?: string }>;
}) {
  const { id, run } = await searchParams;
  return (
    <Suspense fallback={null}>
      <WorkflowProvider workflowId={id} autoRun={run === "1"}>
        <BuilderClient />
      </WorkflowProvider>
    </Suspense>
  );
}