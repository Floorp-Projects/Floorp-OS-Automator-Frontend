import React from "react";
import type { RunWorkflowResponse } from "@/gen/sapphillon/v1/workflow_service_pb";
import type { RunEvent } from "@/types/workflow";

interface WorkflowRunContextType {
    running: boolean;
    activeWorkflowId: string | null;
    events: RunEvent[];
    runRes: RunWorkflowResponse | null;
    setRunning: (running: boolean) => void;
    setActiveWorkflowId: (id: string | null) => void;
    setEvents: React.Dispatch<React.SetStateAction<RunEvent[]>>;
    setRunRes: (res: RunWorkflowResponse | null) => void;
    appendEvent: (e: Omit<RunEvent, "t">) => void;
    clearEvents: () => void;
}

export const WorkflowRunContext = React.createContext<
    WorkflowRunContextType | null
>(null);

export function useWorkflowRunState() {
    const context = React.useContext(WorkflowRunContext);
    if (!context) {
        throw new Error(
            "useWorkflowRunState must be used within a WorkflowRunProvider",
        );
    }
    return context;
}
