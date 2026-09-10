export type Session = { id: string; text: string; topic?: string; pacingSeconds?: number; durationSeconds?: number; keywords?: string[]; }; export type PipelineInput = { sessions: Session[]; };
