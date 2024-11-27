export interface EnrollmentTokenResult {
    enrollmentId: string;
    memberTenantId: string;
    iat: number;
    exp: number;
}

export interface IEnrollmentToken {
    enrollmentId: string;
    memberTenantId: string;
    isExpired: boolean
}