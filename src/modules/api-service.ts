import axios, {AxiosResponse} from 'axios';
import * as starknet from 'starknet';
import {type ChainId, isLocalhost} from './abstract-core.js';
import {globalService} from './global-service.js';

const apiUrlV2Coolify = 'https://influence-api-v2.elerium.dev';
const apiUrl = isLocalhost ? 'http://127.0.0.1:3001' : apiUrlV2Coolify;

interface GenerateMessageLoginResponse {
    status: number,
    success: boolean,
    typedData?: starknet.TypedData, // if "success" TRUE
    token?: string, // if "success" TRUE
    error?: string, // if "success" FALSE
}

interface VerifySignatureResponse {
    status: number,
    success: boolean,
    token?: string, // if "success" TRUE
    error?: string, // if "success" FALSE
}

interface AuthedResponse {
    status: number,
    success: boolean,
    data?: any, // if "success" TRUE
    error?: string, // if "success" FALSE
}

/**
 * Singleton
 */
class ApiService {
    private static instance: ApiService;

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    private async axios(config: Object): Promise<AxiosResponse> {
        globalService.setIsPending(true);
        try {
            const responseData = await axios(config);
            globalService.setIsPending(false);
            return responseData;
        } catch (error: any) {
            globalService.setIsPending(false);
            throw error;
        }
    }

    public async generateMessageLogin(
        walletAddress: string,
        chainId: ChainId,
    ): Promise<GenerateMessageLoginResponse> {
        try {
            const config = {
                method: 'post',
                url: `${apiUrl}/generate-message-login`,
                data: {
                    walletAddress,
                    chainId,
                },
            };
            // console.log(`--- [generateMessageLogin] ${config.method.toUpperCase()} ${config.url} + body:`, config.data); //// TEST
            const response = await this.axios(config);
            const responseData = response.data as GenerateMessageLoginResponse;
            // console.log(`--- [generateMessageLogin] responseData:`, responseData); //// TEST
            return responseData;
        } catch (error: any) {
            // console.log(`--- [generateMessageLogin] ERROR:`, error); //// TEST
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }

    public async verifySignature(
        typedData: starknet.TypedData,
        signature: starknet.Signature,
        token: string,
    ): Promise<VerifySignatureResponse> {
        try {
            const config = {
                method: 'post',
                url: `${apiUrl}/verify-signature`,
                data: {
                    typedData,
                    signature,
                    token,
                },
            };
            // console.log(`--- [verifySignature] ${config.method.toUpperCase()} ${config.url} + body:`, config.data); //// TEST
            const response = await this.axios(config);
            const responseData = response.data as VerifySignatureResponse;
            // console.log(`--- [verifySignature] responseData:`, responseData); //// TEST
            return responseData;
        } catch (error: any) {
            // console.log(`--- [verifySignature] ERROR:`, error); //// TEST
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }

    public async authTest(
        data: any,
        token?: string,
    ): Promise<AuthedResponse> {
        try {
            const config = {
                method: 'post',
                url: `${apiUrl}/auth-test`,
                data: {
                    data,
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            };
            // console.log(`--- [authTest] ${config.method.toUpperCase()} ${config.url} + body:`, config.data); //// TEST
            const response = await this.axios(config);
            const responseData = response.data as AuthedResponse;
            // console.log(`--- [authTest] responseData:`, responseData); //// TEST
            return responseData;
        } catch (error: any) {
            // console.log(`--- [authTest] ERROR:`, error); //// TEST
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }
}

const apiService: ApiService = ApiService.getInstance(); // singleton

export {
    apiService,
}
