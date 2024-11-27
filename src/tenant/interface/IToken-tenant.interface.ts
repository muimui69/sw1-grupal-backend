export interface TenantTokenResult {
    tenantId: string;
    memberTenantId: string;
    iat: number;
    exp: number;
}

export interface ITenantToken {
    tenantId: string;
    memberTenantId: string;
    isExpired: boolean
}