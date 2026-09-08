"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnConnect,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { callAI } from "@/lib/ai";
import { executeWorkflow, getExecutionOrder, validateWorkflow } from "@/lib/workflow-engine";
import {
  createBlankWorkflow,
  getWorkflow,
  saveWorkflow as persistWorkflow,
  deleteWorkflow as deleteStoredWorkflow,
} from "@/lib/storage";
import { getTemplate } from "@/lib/templates";
import type {
  ExecutionLogEntry,
  GeneratedWorkflow,
  SavedEdge,
  SavedNode,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeConfig,
  WorkflowNodeType,
  WorkflowRunStatus,
} from "@/types/workflow";
import { uid } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type SaveStatus = "idle" | "saving" | "saved";

interface WorkflowContextValue {
  workflowId: string | null;
  workflowName: string;
  setWorkflowName: (name: string) => void;
  description: string;
  setDescription: (text: string) => void;
  saveStatus: SaveStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: OnConnect;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNode: WorkflowNode | null;
  addNode: (type: WorkflowNodeType, position: { x: number; y: number }) => void;
  updateNodeConfig: (id: string, patch: Partial<WorkflowNodeConfig>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  runWorkflow: () => Promise<void>;
  stopWorkflow: () => void;
  regenerate: () => Promise<void>;
  isRunning: boolean;
  runStatus: WorkflowRunStatus;
  executionPlan: Array<{ id: string; label: string; type: WorkflowNodeType }>;
  executionLog: ExecutionLogEntry[];
  clearExecution: () => void;
  manualSave: () => void;
  applyWorkflow: (workflow: GeneratedWorkflow) => string;
  openTemplate: (templateId: string) => string;
  deleteWorkflow: () => void;
  notFound: boolean;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

function toSavedNode(node: WorkflowNode): SavedNode {
  const type = node.type as WorkflowNodeType;
  return {
    id: node.id,
    type,
    position: { x: node.position.x, y: node.position.y },
    config: node.data.config,
  };
}

function hydrateNodes(snapshotNodes: SavedNode[]): WorkflowNode[] {
  return snapshotNodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: { config: node.config, status: "idle" as const },
  }));
}

export function WorkflowProvider({
  children,
  workflowId: initialId,
  autoRun = false,
}: {
  children: ReactNode;
  workflowId?: string;
  autoRun?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [workflowId, setWorkflowId] = useState<string | null>(initialId ?? null);
  const [workflowName, setWorkflowNameState] = useState("Untitled workflow");
  const [description, setDescriptionState] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [notFound, setNotFound] = useState(false);

  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [runStatus, setRunStatus] = useState<WorkflowRunStatus>("idle");
  const [executionPlan, setExecutionPlan] = useState<
    Array<{ id: string; label: string; type: WorkflowNodeType }>
  >([]);
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([]);

  const cancelledRef = useRef(false);
  const dirtyRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const autoRunFired = useRef(false);

  /* --------------------------- initial load --------------------------- */

  useEffect(() => {
    if (!initialId) {
      const blank = createBlankWorkflow();
      setWorkflowId(blank.meta.id);
      setWorkflowName(blank.meta.name);
      setDescription(blank.meta.description ?? "");
      setNodes(hydrateNodes(blank.nodes));
      setEdges(blank.edges as WorkflowEdge[]);
      setHydrated(true);
      return;
    }

    const stored = getWorkflow(initialId);
    if (!stored) {
      setNotFound(true);
      setWorkflowId(initialId);
      setWorkflowName("Deleted or missing workflow");
      setNodes(hydrateNodes(createBlankWorkflow().nodes));
      setEdges([]);
      setHydrated(true);
      return;
    }

    setWorkflowId(stored.meta.id);
    setWorkflowName(stored.meta.name);
    setDescription(stored.meta.description ?? "");
    setNodes(hydrateNodes(stored.nodes));
    setEdges(stored.edges as WorkflowEdge[]);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  /* --------------------------- basic setters -------------------------- */

  const setWorkflowName = useCallback((name: string) => {
    dirtyRef.current = true;
    setWorkflowNameState(name);
  }, []);

  const setDescription = useCallback((text: string) => {
    dirtyRef.current = true;
    setDescriptionState(text);
  }, []);

  const onNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    dirtyRef.current = true;
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
    dirtyRef.current = true;
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, id: uid("edge") }, eds));
    dirtyRef.current = true;
  }, []);

  /* ------------------------- node manipulation ------------------------ */

  const addNode = useCallback(
    (type: WorkflowNodeType, position: { x: number; y: number }) => {
      const def = NODE_DEFINITION_MAP[type];
      const id = uid("node");
      const node: WorkflowNode = {
        id,
        type,
        position,
        data: { config: def.createConfig() as WorkflowNodeConfig, status: "idle" },
      };
      setNodes((nds) => [...nds, node]);
      setSelectedNodeId(id);
      dirtyRef.current = true;
    },
    [],
  );

  const updateNodeConfig = useCallback(
    (id: string, patch: Partial<WorkflowNodeConfig>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  status: node.data.status,
                  output: node.data.output,
                  result: node.data.result,
                  durationMs: node.data.durationMs,
                  config: {
                    ...(node.data.config as unknown as object),
                    ...(patch as object),
                  } as WorkflowNodeConfig,
                },
              }
            : node,
        ),
      );
      dirtyRef.current = true;
    },
    [],
  );

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNodeId((current) => (current === id ? null : current));
    setExecutionLog((log) => log.filter((entry) => entry.nodeId !== id));
    dirtyRef.current = true;
  }, []);

  const duplicateNode = useCallback(
    (id: string) => {
      const source = nodes.find((node) => node.id === id);
      if (!source) return;
      const newId = uid("node");
      const node: WorkflowNode = {
        ...source,
        id: newId,
        position: { x: source.position.x + 240, y: source.position.y + 80 },
        data: {
          ...source.data,
          status: "idle",
          output: undefined,
          result: undefined,
          error: undefined,
          durationMs: undefined,
        },
      };
      setNodes((nds) => [...nds, node]);
      setSelectedNodeId(newId);
      dirtyRef.current = true;
    },
    [nodes],
  );

  /* ----------------------------- execution ---------------------------- */

  const runWorkflow = useCallback(async () => {
    if (runStatus === "running") return;
    if (nodes.length === 0) {
      toast.error("Nothing to run", "Add at least an Input and an Output node.");
      return;
    }

    const savedNodes = nodes.map(toSavedNode);
    const savedEdges: SavedEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    const validation = validateWorkflow(savedNodes, savedEdges);
    if (!validation.ok) {
      toast.error("Workflow needs attention", validation.errors[0]);
      return;
    }

    cancelledRef.current = false;
    setRunStatus("running");

    const orderResult = getExecutionOrder(savedNodes, savedEdges);
    const plan = orderResult.ok
      ? orderResult.order.map((node) => ({
          id: node.id,
          label: nodeLabel(node),
          type: node.type,
        }))
      : [];
    setExecutionPlan(plan);
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "pending",
          output: undefined,
          error: undefined,
          durationMs: undefined,
          result: undefined,
        },
      })),
    );
    setExecutionLog(
      plan.map((step) => ({
        id: uid("log"),
        nodeId: step.id,
        nodeLabel: step.label,
        nodeType: step.type,
        status: "pending",
      })),
    );

    const summary = await executeWorkflow(
      savedNodes,
      savedEdges,
      callAI,
      {
        onRunning: (nodeId) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, status: "running" } }
                : node,
            ),
          );
          setExecutionLog((log) =>
            log.map((entry) =>
              entry.nodeId === nodeId
                ? { ...entry, status: "running", startedAt: Date.now() }
                : entry,
            ),
          );
        },
        onCompleted: (nodeId, result) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: "completed",
                      output: result.output,
                      durationMs: result.durationMs,
                      result: result.qualityResult,
                    },
                  }
                : node,
            ),
          );
          setExecutionLog((log) =>
            log.map((entry) =>
              entry.nodeId === nodeId
                ? { ...entry, status: "completed", durationMs: result.durationMs }
                : entry,
            ),
          );
        },
        onFailed: (nodeId, message) => {
          setNodes((nds) =>
            nds.map((node) =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, status: "failed", error: message } }
                : node,
            ),
          );
          setExecutionLog((log) =>
            log.map((entry) =>
              entry.nodeId === nodeId
                ? { ...entry, status: "failed", error: message }
                : entry,
            ),
          );
        },
      },
      () => cancelledRef.current,
    );

    setRunStatus(
      summary.ok
        ? "completed"
        : cancelledRef.current
          ? "stopped"
          : "failed",
    );

    if (summary.ok) {
      toast.success(
        "Workflow completed",
        `${summary.completedCount} stages · ${(summary.totalDurationMs / 1000).toFixed(1)}s`,
      );
    } else if (cancelledRef.current) {
      toast.info("Workflow stopped", "Execution was cancelled.");
    } else if (summary.error) {
      toast.error("Workflow failed", summary.error);
    }
  }, [nodes, edges, runStatus, toast]);

  const stopWorkflow = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  // Auto-run on first load (dashboard "Run" deep-link).
  useEffect(() => {
    if (!hydrated || !autoRun || notFound || autoRunFired.current) return;
    autoRunFired.current = true;
    const timeout = window.setTimeout(() => {
      void runWorkflow();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [hydrated, autoRun, notFound, runWorkflow]);

  const regenerate = useCallback(async () => {
    await runWorkflow();
  }, [runWorkflow]);

  const clearExecution = useCallback(() => {
    setExecutionLog([]);
    setExecutionPlan([]);
    setRunStatus("idle");
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: "idle",
          output: undefined,
          error: undefined,
          durationMs: undefined,
          result: undefined,
        },
      })),
    );
  }, []);

  /* --------------------------- persistence --------------------------- */

  const persist = useCallback(() => {
    if (!workflowId) return;
    const cleanNodes = nodes.map(toSavedNode);
    const cleanEdges: SavedEdge[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));
    const existing = getWorkflow(workflowId);
    persistWorkflow({
      meta: {
        id: workflowId,
        name: workflowName.trim() || "Untitled workflow",
        description: description.trim() || undefined,
        createdAt: existing?.meta.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes: cleanNodes,
      edges: cleanEdges,
    });
  }, [workflowId, nodes, edges, workflowName, description]);

  const manualSave = useCallback(() => {
    persist();
    setSaveStatus("saving");
    window.setTimeout(() => setSaveStatus("saved"), 500);
    toast.success("Workflow saved");
  }, [persist, toast]);

  // Debounced autosave after the first user edit.
  useEffect(() => {
    if (!dirtyRef.current || !workflowId || runStatus === "running") return;
    dirtyRef.current = false;
    const timeout = window.setTimeout(() => {
      persist();
      setSaveStatus("saved");
      void router.replace(`/builder?id=${workflowId}`, { scroll: false });
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [nodes, edges, workflowName, description, workflowId, runStatus, persist, router]);

  const applyWorkflow = useCallback(
    (workflow: GeneratedWorkflow): string => {
      const newId = uid("wf");
      setWorkflowId(newId);
      setWorkflowName(workflow.name || "AI Generated Workflow");
      setDescription(workflow.description ?? "");
      setNodes(hydrateNodes(workflow.nodes));
      setEdges(workflow.edges as WorkflowEdge[]);
      setSelectedNodeId(null);
      setRunStatus("idle");
      setExecutionLog([]);
      setExecutionPlan([]);
      dirtyRef.current = true;

      persistWorkflow({
        meta: {
          id: newId,
          name: workflow.name || "AI Generated Workflow",
          description: workflow.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        nodes: workflow.nodes,
        edges: workflow.edges,
      });
      void router.replace(`/builder?id=${newId}`, { scroll: false });
      return newId;
    },
    [router, setWorkflowName, setDescription],
  );

  const openTemplate = useCallback(
    (templateId: string): string => {
      const template = getTemplate(templateId);
      if (!template) return "";
      return applyWorkflow(template.build());
    },
    [applyWorkflow],
  );

  const deleteWorkflow = useCallback(() => {
    if (!workflowId) return;
    deleteStoredWorkflow(workflowId);
    toast.success("Workflow deleted");
    void router.push("/dashboard");
  }, [workflowId, router, toast]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const value = useMemo<WorkflowContextValue>(
    () => ({
      workflowId,
      workflowName,
      setWorkflowName,
      description,
      setDescription,
      saveStatus,
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      selectedNodeId,
      setSelectedNodeId,
      selectedNode,
      addNode,
      updateNodeConfig,
      deleteNode,
      duplicateNode,
      runWorkflow,
      stopWorkflow,
      regenerate,
      isRunning: runStatus === "running",
      runStatus,
      executionPlan,
      executionLog,
      clearExecution,
      manualSave,
      applyWorkflow,
      openTemplate,
      deleteWorkflow,
      notFound,
    }),
    [
      workflowId, workflowName, setWorkflowName, description, setDescription,
      saveStatus, nodes, edges, onNodesChange, onEdgesChange, onConnect,
      selectedNodeId, setSelectedNodeId, selectedNode, addNode, updateNodeConfig,
      deleteNode, duplicateNode, runWorkflow, stopWorkflow, regenerate,
      runStatus, executionPlan, executionLog, clearExecution, manualSave,
      applyWorkflow, openTemplate, deleteWorkflow, notFound,
    ],
  );

  return (
    <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
  );
}

function nodeLabel(node: SavedNode): string {
  return (
    (node.config as { label?: string }).label ||
    NODE_DEFINITION_MAP[node.type]?.label ||
    node.type
  );
}

export function useWorkflow(): WorkflowContextValue {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within WorkflowProvider");
  }
  return context;
}