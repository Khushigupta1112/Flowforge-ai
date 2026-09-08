"use client";

import { useCallback, useMemo, useState, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import { nodeTypes } from "@/components/workflow/nodes";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { useWorkflow } from "@/components/workflow/WorkflowContext";
import type { WorkflowNode, WorkflowNodeType } from "@/types/workflow";
import { cn } from "@/lib/utils";

function nodeColor(node: WorkflowNode): string {
  const type = node.type as WorkflowNodeType;
  const def = NODE_DEFINITION_MAP[type];
  return def ? def.color : "#38bdf8";
}

const defaultEdgeOptions = {
  type: "smoothstep" as const,
  markerEnd: { type: "arrowclosed" as const, width: 14, height: 14, color: "#3c4556" },
};

function CanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    addNode,
  } = useWorkflow();
  const { screenToFlowPosition } = useReactFlow();
  const [isOver, setIsOver] = useState(false);

  const nodeTypesMemo = useMemo<NodeTypes>(() => nodeTypes as unknown as NodeTypes, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsOver(true);
  }, []);

  const onDragLeave = useCallback(() => setIsOver(false), []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      setIsOver(false);
      const type = event.dataTransfer.getData("application/flowforge-node") as WorkflowNodeType;
      if (!type || !NODE_DEFINITION_MAP[type]) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(type, {
        x: position.x - 124,
        y: position.y - 40,
      });
    },
    [screenToFlowPosition, addNode],
  );

  return (
    <div
      className={cn(
        "relative h-full w-full",
        isOver && "after:absolute after:inset-0 after:z-10 after:rounded-xl after:border-2 after:border-dashed after:border-indigo-400/50 after:bg-indigo-500/[0.04] after:content-['']",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-drop-zone
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypesMemo}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={() => setSelectedNodeId(null)}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.35, maxZoom: 1 }}
        minZoom={0.25}
        maxZoom={1.6}
        proOptions={{ hideAttribution: false }}
        deleteKeyCode={["Backspace", "Delete"]}
        selectionOnDrag
        panOnScroll
        connectionRadius={28}
        colorMode="dark"
      >
        <Background
          gap={22}
          size={1}
          color="#1d2433"
          variant={BackgroundVariant.Dots}
          className="opacity-60!"
        />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="bottom-right"
          nodeColor={nodeColor}
          nodeStrokeWidth={2}
          maskColor="rgba(9, 11, 15, 0.75)"
          className="!h-32! !w-48!"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}