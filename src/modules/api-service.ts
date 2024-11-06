import axios from 'axios';
import * as starknet from 'starknet';
import {type ChainId, isLocalhost} from './abstract-core.js';

const apiUrlV2Coolify = 'https://influence-api-v2.elerium.dev';
const apiUrl = isLocalhost ? 'http://127.0.0.1:3001' : apiUrlV2Coolify;

interface JWTPayloadForAuth {
    walletAddress: string,
    chainId: string,
    nonce?: string,
}

interface GenerateMessageLoginResponse {
    typedData: starknet.TypedData,
    token: string,
}

interface VerifySignatureResponse {
    success: boolean,
    token?: string, // if "success" TRUE
    error?: string, // if "success" FALSE
}

interface AuthedResponse {
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

    public async generateMessageLogin(walletAddress: string, chainId: ChainId): Promise<GenerateMessageLoginResponse> {
        try {
            const config = {
                method: 'post',
                url: `${apiUrl}/generate-message-login`,
                body: {
                    walletAddress,
                    chainId,
                },
            };
            // console.log(`--- [generateMessageLogin] ${config.method.toUpperCase()} ${config.url} + body:`, config.body); //// TEST
            const response = await axios(config);
            const responseData = response.data;
            // console.log(`--- [generateMessageLogin] responseData:`, responseData); //// TEST
            return responseData;
        } catch (error: any) {
            // console.log(`--- [generateMessageLogin] ERROR:`, error); //// TEST
            throw error;
        }
    }
}

const apiService: ApiService = ApiService.getInstance(); // singleton

export {
    apiService,
}
