export type AiWorkflowState = {
  organizationId: string;
  invoiceId: string;
  extracted?: Record<string, unknown>;
  match?: Record<string, unknown>;
  exceptions?: Array<{ code: string; severity: "LOW" | "MEDIUM" | "HIGH"; explanation: string }>;
};

export const invoiceProcessingWorkflow = {
  name: "invoice-processing-langgraph",
  nodes: ["ocr", "extract", "match", "detectExceptions", "routeApproval"],
  edges: [
    ["ocr", "extract"],
    ["extract", "match"],
    ["match", "detectExceptions"],
    ["detectExceptions", "routeApproval"]
  ],
  stateChannels: ["organizationId", "invoiceId", "extracted", "match", "exceptions"]
} as const;
