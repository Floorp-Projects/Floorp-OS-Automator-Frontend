import React from "react";
import type { RunWorkflowResponse } from "@/gen/sapphillon/v1/workflow_service_pb";
import type { RunEvent } from "@/types/workflow";
import { WorkflowRunContext } from "./WorkflowRunContext";

export function WorkflowRunProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [running, setRunning] = React.useState(false);
    const [activeWorkflowId, setActiveWorkflowId] = React.useState<
        string | null
    >(null);
    const [events, setEvents] = React.useState<RunEvent[]>([]);
    const [runRes, setRunRes] = React.useState<RunWorkflowResponse | null>(
        null,
    );

    const appendEvent = React.useCallback((e: Omit<RunEvent, "t">) => {
        setEvents((prev) => [...prev, { t: Date.now(), ...e }]);
    }, []);

    const clearEvents = React.useCallback(() => {
        setEvents([]);
    }, []);

    return (
        <WorkflowRunContext.Provider
            value={{
                running,
                activeWorkflowId,
                events,
                runRes,
                setRunning,
                setActiveWorkflowId,
                setEvents,
                setRunRes,
                appendEvent,
                clearEvents,
            }}
        >
            {children}
        </WorkflowRunContext.Provider>
    );
}
