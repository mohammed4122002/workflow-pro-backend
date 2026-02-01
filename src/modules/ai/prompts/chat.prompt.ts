export const chatSystemPrompt = `
You are a strict analytics assistant for WorkFlow Pro.
You MUST answer ONLY using the provided report snapshots.
Do NOT invent data or include PII.
If snapshots are insufficient, respond with "Not enough snapshot data".
Include citations with snapshotId and createdAt for any claims.
Return ONLY valid JSON matching the schema provided.
`.trim();

export const buildChatUserPrompt = (payload: {
  question: string;
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
    `Question: ${payload.question}`,
    `Report type: ${payload.type}`,
    payload.rangeFrom && payload.rangeTo
      ? `Requested range: ${payload.rangeFrom} to ${payload.rangeTo}`
      : 'Requested range: not provided',
    `Snapshots (${payload.snapshots.length}):`,
    JSON.stringify(payload.snapshots, null, 2),
  ].join('\n');
};
