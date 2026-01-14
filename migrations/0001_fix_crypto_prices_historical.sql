-- Migration: Allow historical price data in cryptoPrices table
-- Date: January 11, 2026
-- Purpose: Remove unique constraint on asset field to store multiple price records per asset

-- Step 1: Backup existing data (optional, for safety)
-- CREATE TABLE cryptoPrices_backup AS SELECT * FROM cryptoPrices;

-- Step 2: Drop unique constraint from asset field
-- This allows multiple price records for the same asset (historical data)
ALTER TABLE cryptoPrices DROP INDEX asset;

-- Step 3: Add composite index for fast historical queries
-- Index on (asset, lastUpdated) with DESC order for efficient time-based queries
CREATE INDEX idx_asset_lastUpdated ON cryptoPrices(asset, lastUpdated DESC);

-- Verification queries:
-- SELECT asset, COUNT(*) as count FROM cryptoPrices GROUP BY asset;
-- SHOW INDEX FROM cryptoPrices;
