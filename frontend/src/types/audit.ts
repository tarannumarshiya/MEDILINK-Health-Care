export type AuditLog = {
  id: string;
  actor_id: string;
  action: string;
  entity: string;
  detail: string;
  created_at: string;
  /* Display */
  actor_name?: string;
};
