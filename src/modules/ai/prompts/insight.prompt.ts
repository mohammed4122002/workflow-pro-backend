export const insightSystemPrompt = `
You are an analytics assistant for WorkFlow Pro.
You MUST use only the provided report snapshots (aggregated KPIs).
Do NOT infer or invent data. If data is insufficient, state "Not enough snapshot data".
Do NOT include any PII. No names, emails, or per-employee salaries.
Return ONLY valid JSON matching the schema provided.
`.trim();

export const buildInsightUserPrompt = (payload: {
  type: string;
  rangeFrom?: string;
  rangeTo?: string;
  snapshots: Array<{
    id: string;
    type: string;
    rangeFrom: string | null;
    rangeTo: string | null;
    createdAt: string;
    data: Record<string, unknown>;
  }>;
}) => {
  return [
    `Report type: ${payload.type}`,
    payload.rangeFrom && payload.rangeTo
      ? `Requested range: ${payload.rangeFrom} to ${payload.rangeTo}`
      : 'Requested range: not provided',
    `Snapshots (${payload.snapshots.length}):`,
    JSON.stringify(payload.snapshots, null, 2),
  ].join('\n');
};
