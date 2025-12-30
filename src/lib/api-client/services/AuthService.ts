/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AuthService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public postApiAuthSignIn(
        requestBody?: {
            /**
             * Email or username
             */
            login: string;
            /**
             * User password
             */
            password: string;
        },
    ): CancelablePromise<{
        /**
         * JWT access token
         */
        token: string;
        /**
         * JWT refresh token
         */
        refreshToken: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/sign-in',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Invalid data`,
                401: `Unauthorized - Invalid credentials`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public postApiAuthSignUp(
        requestBody?: {
            /**
             * User email
             */
            email: string;
            /**
             * Username
             */
            username: string;
            /**
             * User password
             */
            password: string;
            /**
             * User full name
             */
            displayName?: string;
            /**
             * Cloudflare Turnstile token
             */
            turnstileToken: string;
        },
    ): CancelablePromise<{
        /**
         * JWT access token
         */
        token: string;
        /**
         * JWT refresh token
         */
        refreshToken: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/sign-up',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Invalid data`,
                409: `Conflict - Email or username already exists`,
            },
        });
    }
    /**
     * @returns any Success
     * @throws ApiError
     */
    public postApiAuthSignOut(): CancelablePromise<{
        success: boolean;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/sign-out',
        });
    }
    /**
     * @returns any Success - Account deleted
     * @throws ApiError
     */
    public deleteApiAuthAccount(): CancelablePromise<{
        success: boolean;
    }> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/auth/account',
            errors: {
                401: `Unauthorized - Not logged in`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Successfully refreshed access token
     * @throws ApiError
     */
    public postApiAuthRefresh(
        requestBody?: {
            /**
             * Refresh token (optional if sent via cookie)
             */
            refreshToken?: string;
        },
    ): CancelablePromise<{
        /**
         * New JWT access token
         */
        token: string;
        /**
         * JWT refresh token
         */
        refreshToken: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/auth/refresh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid or expired refresh token`,
            },
        });
    }
}
