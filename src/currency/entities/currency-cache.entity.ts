import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CurrencyCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  currencyCode: string;

  @Column('float')
  rate: number;

  @Column('text')
  provider: string;

  @Column('timestamp')
  lastUpdated: Date;

  @Column('timestamp')
  expiresAt: Date;
}
