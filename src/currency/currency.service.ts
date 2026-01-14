/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CurrencyCache } from './entities/currency-cache.entity';

export interface CurrencyResponse {
  USD: number;
  EUR: number;
  MLC: number;
  lastUpdate: string;
}

const CACHE_TTL_HOURS = 24;

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger('CurrencyService');
  private readonly baseUrl = 'https://tasas.eltoque.com/v1';
  private inMemoryCache: CurrencyResponse | null = null;

  constructor(
    @InjectRepository(CurrencyCache)
    private readonly currencyCacheRepository: Repository<CurrencyCache>,
  ) {
    this.initializeCache().catch((error) => {
      this.logger.error(`Failed to initialize cache: ${error.message}`);
    });
  }

  private async initializeCache(): Promise<void> {
    const cached = await this.getCachedFromDB();
    if (cached) {
      this.inMemoryCache = cached;
      this.logger.log('In-memory cache initialized from database');
    } else {
      await this.refreshCache(true);
    }
  }

  async getCurrencies(): Promise<CurrencyResponse> {
    const cached = this.inMemoryCache;
    const now = new Date();

    if (cached && cached.lastUpdate) {
      const lastUpdate = new Date(cached.lastUpdate);
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < CACHE_TTL_HOURS) {
        this.logger.debug('Returning cached currency data');
        return cached;
      }
    }

    try {
      this.logger.log('Cache expired or missing, refreshing from external API');
      const freshData = await this.fetchFromExternalAPI();
      await this.saveToCache(freshData);
      this.inMemoryCache = freshData;
      return freshData;
    } catch {
      if (this.inMemoryCache) {
        this.logger.warn('External API failed, returning stale cache as fallback');
        return this.inMemoryCache;
      }
      throw new InternalServerErrorException(
        'Unable to fetch currency data and no cache available',
      );
    }
  }

  private async fetchFromExternalAPI(retryCount = 0): Promise<CurrencyResponse> {
    const maxRetries = 3;
    const apiKey = process.env.ELTOQUE_API_KEY;

    if (!apiKey) {
      throw new InternalServerErrorException('ELTOQUE_API_KEY not configured');
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const startTime = "00:00:01";
    const endTime = "23:59:01";

    const dateFrom = `${dateStr} ${startTime}`;
    const dateTo = `${dateStr} ${endTime}`;

    const encodedDateFrom = encodeURIComponent(dateFrom);
    const encodedDateTo = encodeURIComponent(dateTo);

    const url = `${this.baseUrl}/trmi?date_from=${encodedDateFrom}&date_to=${encodedDateTo}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `External API request failed: ${response.status} - ${errorText}`,
        );

        if (retryCount < maxRetries && this.isRetryableError(response.status)) {
          const delay = Math.pow(2, retryCount) * 1000;
          this.logger.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          await this.sleep(delay);
          return this.fetchFromExternalAPI(retryCount + 1);
        }

        throw new InternalServerErrorException(
          `External API error: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      return this.transformToCurrencyResponse(data, dateStr);
    } catch (error) {
      this.logger.error(`Error fetching from external API: ${error.message}`);

      if (retryCount < maxRetries && retryCount > 0) {
        const delay = Math.pow(2, retryCount) * 1000;
        this.logger.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await this.sleep(delay);
        return this.fetchFromExternalAPI(retryCount + 1);
      }

      throw error;
    }
  }

  private transformToCurrencyResponse(data: any, dateStr: string): CurrencyResponse {
    return {
      USD: data.tasas?.USD || 1,
      EUR: data.tasas?.USDT_TRC20 || data.tasas?.ECU || 1,
      MLC: data.tasas?.MLC || 1,
      lastUpdate: data.date || dateStr,
    };
  }

  private async saveToCache(data: CurrencyResponse): Promise<void> {
    try {
      await this.currencyCacheRepository.clear();

      const currencies = [
        { code: 'USD', rate: data.USD },
        { code: 'EUR', rate: data.EUR },
        { code: 'MLC', rate: data.MLC },
      ];

      const cacheEntries = currencies.map((currency) =>
        this.currencyCacheRepository.create({
          currencyCode: currency.code,
          rate: currency.rate,
          provider: 'eltoque',
          lastUpdated: new Date(data.lastUpdate),
          expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000),
        }),
      );

      await this.currencyCacheRepository.save(cacheEntries);
      this.logger.log('Currency cache updated and saved to database');
    } catch (error) {
      this.logger.error(`Failed to save cache to database: ${error.message}`);
    }
  }

  private async getCachedFromDB(): Promise<CurrencyResponse | null> {
    try {
      const entries = await this.currencyCacheRepository.find({
        where: { expiresAt: { $gt: new Date() } } as any,
      });

      if (entries.length === 0) {
        return null;
      }

      const lastUpdated = entries[0].lastUpdated;

      return {
        USD: entries.find((e) => e.currencyCode === 'USD')?.rate || 1,
        EUR: entries.find((e) => e.currencyCode === 'EUR')?.rate || 1,
        MLC: entries.find((e) => e.currencyCode === 'MLC')?.rate || 1,
        lastUpdate: lastUpdated.toISOString().split('T')[0],
      };
    } catch (error) {
      this.logger.error(`Failed to read cache from database: ${error.message}`);
      return null;
    }
  }

  private isRetryableError(statusCode: number): boolean {
    return statusCode >= 500 || statusCode === 429;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleScheduledRefresh() {
    this.logger.log('Scheduled cache refresh triggered');
    try {
      await this.refreshCache(false);
    } catch (error) {
      this.logger.error(`Scheduled refresh failed: ${error.message}`);
    }
  }

  private async refreshCache(force: boolean): Promise<void> {
    const cached = this.inMemoryCache;
    const now = new Date();

    if (!force && cached && cached.lastUpdate) {
      const lastUpdate = new Date(cached.lastUpdate);
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < CACHE_TTL_HOURS) {
        this.logger.debug('Cache still valid, skipping refresh');
        return;
      }
    }

    const freshData = await this.fetchFromExternalAPI();
    await this.saveToCache(freshData);
    this.inMemoryCache = freshData;
  }
}
