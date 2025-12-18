/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PostService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param requestBody
     * @returns any Post created successfully
     * @throws ApiError
     */
    public postApiPosts(
        requestBody?: {
            /**
             * Post text content
             */
            text: string;
            /**
             * Array of upload tracking IDs to attach to the post
             */
            attachments?: Array<number>;
        },
    ): CancelablePromise<{
        id: number;
        text: string;
        createdBy: number;
        user: any | null;
        createdAt: string;
        updatedAt: string | null;
        attachments?: Array<{
            id: number;
            filename: string;
            createdAt: string;
        }>;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/posts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Invalid input`,
                401: `Unauthorized - Authentication required`,
                404: `Not found - One or more attachment IDs not found`,
                500: `Internal server error - Failed to create post`,
            },
        });
    }
    /**
     * @returns any Posts retrieved successfully
     * @throws ApiError
     */
    public getApiPosts(): CancelablePromise<{
        posts: Array<{
            id: number;
            text: string;
            createdBy: number;
            user: any | null;
            createdAt: string;
            updatedAt: string | null;
            attachments: Array<{
                /**
                 * URI to access the attachment
                 */
                uri: string;
            }>;
        }>;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/posts',
            errors: {
                401: `Unauthorized - Authentication required`,
                500: `Internal server error - Failed to retrieve posts`,
            },
        });
    }
    /**
     * @param id Post ID to delete
     * @returns any Post deleted successfully
     * @throws ApiError
     */
    public deleteApiPosts(
        id: string,
    ): CancelablePromise<{
        /**
         * Success message
         */
        message: string;
    }> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/posts/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized - Authentication required`,
                403: `Forbidden - Post does not belong to user`,
                404: `Not found - Post not found`,
                500: `Internal server error - Failed to delete post`,
            },
        });
    }
}
