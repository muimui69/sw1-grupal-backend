declare namespace Express {
  interface Request {
    userId: string;
    tenantId: string;
    memberTenantId: string;
    enrollmentId: string;
  }
}