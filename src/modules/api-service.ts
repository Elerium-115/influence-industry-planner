import axios, {AxiosResponse} from 'axios';
import * as starknet from 'starknet';
import {
    ChainId,
    LotDataByIdResponse,
    StandardResponse,
} from './types.js';
import {isLocalhost} from './abstract-core.js';
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

    private async axios(config: Object, pendingMessage: string = ''): Promise<AxiosResponse> {
        globalService.setIsPending(true, pendingMessage);
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
            const response = await this.axios(config, 'Generating login message for your wallet...');
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
            const response = await this.axios(config, 'Verifying your signature...');
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

    public async verifyToken(token: string): Promise<StandardResponse> {
        try {
            const config = {
                method: 'post',
                url: `${apiUrl}/verify-token`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await this.axios(config, 'Verifying your token...');
            const responseData = response.data as StandardResponse;
            // console.log(`--- [verifyToken] responseData:`, responseData); //// TEST
            return responseData;
        } catch (error: any) {
            // console.log(`--- [verifyToken] ERROR:`, error); //// TEST
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }

    public async fetchLotsData(
        chainId: ChainId,
        lotsIds: number[],
    ): Promise<LotDataByIdResponse> {
        try {
            const config = {
                method: 'post',
                url: `${apiUrl}/lots-data`,
                data: {
                    chainId,
                    lotsIds,
                },
            };
            const response = await this.axios(config, 'Loading in-game lots data...');
            const responseData = response.data as LotDataByIdResponse;
            // console.log(`--- [fetchLotsData] responseData:`, responseData); //// TEST
            return responseData;
        } catch (error: any) {
            // console.log(`--- [fetchLotsData] ERROR:`, error); //// TEST
            if (error.response?.data?.error) {
                throw new Error(error.response.data.error);
            }
            throw error;
        }
    }

    public async fetchBuildingsDataControlled(token: string): Promise<StandardResponse> {
        try {
            const config = {
                method: 'post',
                url: `${apiUrl}/buildings-data-controlled`,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await this.axios(config, 'Loading data for buildings controlled by you in-game...');
            const responseData = response.data as StandardResponse;
            // console.log(`--- [fetchBuildingsDataControlled] responseData:`, responseData); //// TEST
            return responseData;
        } catch (error: any) {
            // console.log(`--- [fetchBuildingsDataControlled] ERROR:`, error); //// TEST
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
