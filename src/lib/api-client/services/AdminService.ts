/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AdminService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns any Cleanup completed successfully
     * @throws ApiError
     */
    public postApiAdminCleanupAttachments(): CancelablePromise<{
        success: boolean;
        data: {
            deletedCount: number;
            deletedFilenames: Array<string>;
            errors?: Array<string>;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/admin/cleanup-attachments',
            errors: {
                401: `Unauthorized - Invalid or missing bearer token`,
                500: `Internal server error - Failed to cleanup attachments`,
            },
        });
    }
}
