/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AttachmentService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param formData
     * @returns any Attachment created successfully
     * @throws ApiError
     */
    public postApiAttachment(
        formData?: {
            /**
             * The file to upload as an attachment
             */
            file: Record<string, any>;
        },
    ): CancelablePromise<{
        success: boolean;
        data: {
            id: number;
            filename: string;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/attachment',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad request - Invalid file or missing file`,
                401: `Unauthorized - Authentication required`,
                500: `Internal server error - Failed to create attachment`,
            },
        });
    }
}
