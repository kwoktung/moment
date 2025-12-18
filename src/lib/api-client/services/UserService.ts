/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class UserService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param requestBody
     * @returns any Avatar updated successfully
     * @throws ApiError
     */
    public patchApiUserAvatar(
        requestBody?: {
            /**
             * Avatar URL or filename. Set to null to clear avatar.
             */
            avatar: (string | null);
        },
    ): CancelablePromise<{
        user: {
            id: number;
            email: string;
            username: string;
            name: string | null;
            avatar: string | null;
        };
    }> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/user/avatar',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Invalid input`,
                401: `Unauthorized - Authentication required`,
                500: `Internal server error - Failed to update avatar`,
            },
        });
    }
}
