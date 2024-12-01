import {ChainId, LotData} from './types.js';

const HOUR_IN_MILLISECONDS = 3_600_000; // 60 * 60 * 1000

const lotsDataByChainAndIdDefault: {[key in ChainId]: {[key: string]: LotData}} = {
    'SN_MAIN': {},
    'SN_SEPOLIA': {},
};

interface CacheData {
    lotsDataByChainAndId: {[key in ChainId]: {[key: string]: LotData}},
}

const cacheDataDefault: CacheData = {
    lotsDataByChainAndId: lotsDataByChainAndIdDefault,
};

/**
 * Singleton
 */
class Cache {
    private static instance: Cache;

    /**
     * NOTE: When updating any of the cached data, the local-storage cache must also be updated.
     */
    private data: CacheData;

    constructor() {
        // Save default cached data into local-storage, if needed
        if (!localStorage.getItem('cache')) {
            localStorage.setItem('cache', JSON.stringify(cacheDataDefault));
        }
        // Load cached data from local-storage
        try {
            this.data = JSON.parse(localStorage.getItem('cache') as string);
        } catch (error) {
            // Swallow this error
            this.data = cacheDataDefault;
        }
        // Inject missing cache properties, in case of obsolete cached data
        for (const key in cacheDataDefault) {
            if (!this.data[key]) {
                this.data[key] = cacheDataDefault[key];
            }
        }
        //// TO DO: purge expired cache entries
        this.saveCache();
    }

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }

    public getData(): CacheData {
        return this.data;
    }

    private saveCache(): void {
        localStorage.setItem('cache', JSON.stringify(this.data));
    }

    public isFreshCacheLotsDataByChainAndId(
        chainId: ChainId,
        lotId: number,
    ): boolean {
        const cacheExpiresInMilliseconds = HOUR_IN_MILLISECONDS;
        const lotData = this.data.lotsDataByChainAndId[chainId][lotId];
        if (!lotData || !lotData._timestamp) {
            return false;
        }
        return Date.now() - lotData._timestamp < cacheExpiresInMilliseconds;
    }

    public setCacheLotsDataByChainAndId(
        chainId: ChainId,
        lotId: number,
        lotData: LotData,
    ): void {
        this.data.lotsDataByChainAndId[chainId][lotId] = lotData;
        this.data.lotsDataByChainAndId[chainId][lotId]._timestamp = Date.now();
        this.saveCache();
    }
}

const cache: Cache = Cache.getInstance(); // singleton

export {
    cache,
}