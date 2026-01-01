/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class RelationshipService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param requestBody
     * @returns any Invite created successfully
     * @throws ApiError
     */
    public postApiRelationshipInviteCreate(
        requestBody?: any,
    ): CancelablePromise<{
        /**
         * 8-character invite code
         */
        inviteCode: string;
        /**
         * Expiration date (ISO 8601)
         */
        expiresAt: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/relationship/invite/create',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Invalid data`,
                401: `Unauthorized - Authentication required`,
                403: `Forbidden - User already has an active relationship or pending invite`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Invite accepted successfully
     * @throws ApiError
     */
    public postApiRelationshipInviteAccept(
        requestBody?: {
            /**
             * 8-character invite code
             */
            inviteCode: string;
        },
    ): CancelablePromise<{
        relationship: {
            id: number;
            partner: {
                id: number;
                username: string;
                displayName: string | null;
                avatar: string | null;
            };
            relationshipStartDate: string | null;
            status: string;
            createdAt: string;
            permanentDeletionAt: string | null;
            resumeRequest: any | null;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/relationship/invite/accept',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Invalid invite code`,
                401: `Unauthorized - Authentication required`,
                403: `Forbidden - Cannot accept own invite or already in relationship`,
                404: `Not found - Invite not found or expired`,
            },
        });
    }
    /**
     * @returns any Relationship info retrieved successfully
     * @throws ApiError
     */
    public getApiRelationship(): CancelablePromise<{
        relationship: any | null;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/relationship',
            errors: {
                401: `Unauthorized - Authentication required`,
            },
        });
    }
    /**
     * @returns any Relationship ended successfully
     * @throws ApiError
     */
    public postApiRelationshipEnd(): CancelablePromise<{
        message: string;
        permanentDeletionAt: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/relationship/end',
            errors: {
                401: `Unauthorized - Authentication required`,
                404: `Not found - No active relationship found`,
            },
        });
    }
    /**
     * @returns any Relationship resumed successfully
     * @throws ApiError
     */
    public postApiRelationshipResume(): CancelablePromise<{
        message: string;
        status: string;
        requestedBy?: number;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/relationship/resume',
            errors: {
                400: `Bad request - Grace period has expired`,
                401: `Unauthorized - Authentication required`,
                404: `Not found - No relationship in pending deletion state`,
            },
        });
    }
    /**
     * @returns any Resume request cancelled successfully
     * @throws ApiError
     */
    public postApiRelationshipResumeCancel(): CancelablePromise<{
        message: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/relationship/resume/cancel',
            errors: {
                401: `Unauthorized - Authentication required`,
                403: `Forbidden - Not the requester`,
                404: `Not found - No pending resume request`,
            },
        });
    }
    /**
     * @param code 8-character invite code
     * @returns any Invite validation result
     * @throws ApiError
     */
    public getApiRelationshipInviteValidate(
        code: string,
    ): CancelablePromise<{
        valid: boolean;
        inviter: any | null;
        expiresAt: string | null;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/relationship/invite/validate',
            query: {
                'code': code,
            },
            errors: {
                400: `Bad request - Invalid code format`,
            },
        });
    }
    /**
     * @returns any User's pending invitation (if any)
     * @throws ApiError
     */
    public getApiRelationshipInvitePending(): CancelablePromise<{
        invitation: any | null;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/relationship/invite/pending',
            errors: {
                401: `Unauthorized - Authentication required`,
            },
        });
    }
}
