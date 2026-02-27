import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables at the top
dotenv.config();

/**
 * Configuration interface for Subscription Bouncer
 */
export interface BouncerConfig {
  target: string;
  price: number;
  port: number;
  wallet: string;
  network: string;
  privateKey: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<BouncerConfig> = {
  price: 0.01,
  port: 4000,
  network: 'base-sepolia'
};

/**
 * Loads and merges configuration from multiple sources:
 * 1. Default values
 * 2. Environment variables
 * 3. Config file (bouncer.config.json)
 * 4. CLI arguments (highest priority)
 * 
 * @param cliArgs - CLI arguments (optional)
 * @returns Merged configuration object
 */
export function loadConfig(cliArgs: Partial<BouncerConfig> = {}): BouncerConfig {
  // Start with defaults
  let config: Partial<BouncerConfig> = { ...DEFAULT_CONFIG };

  // 1. Load from environment variables
  const envConfig: Partial<BouncerConfig> = {
    target: process.env.TARGET_URL,
    price: process.env.PRICE ? parseFloat(process.env.PRICE) : undefined,
    port: process.env.PORT ? parseInt(process.env.PORT) : undefined,
    wallet: process.env.WALLET_ADDRESS,
    network: process.env.NETWORK,
    privateKey: process.env.PINION_PRIVATE_KEY
  };

  // Merge environment variables (override defaults)
  config = mergeConfig(config, envConfig);

  // 2. Load from config file if it exists
  const configFilePath = path.join(process.cwd(), 'bouncer.config.json');
  if (fs.existsSync(configFilePath)) {
    try {
      const configFileContent = fs.readFileSync(configFilePath, 'utf8');
      const fileConfig = JSON.parse(configFileContent) as Partial<BouncerConfig>;
      
      // Merge config file (override environment variables)
      config = mergeConfig(config, fileConfig);
      console.log(`📄 Loaded configuration from ${configFilePath}`);
    } catch (error) {
      console.warn(`⚠️  Warning: Failed to parse bouncer.config.json: ${error instanceof Error ? error.message : error}`);
    }
  }

  // 3. Merge CLI arguments (highest priority)
  config = mergeConfig(config, cliArgs);

  // 4. Validate final configuration
  const finalConfig = validateConfig(config);

  return finalConfig;
}

/**
 * Merges two configuration objects, with source taking priority over target
 * @param target - Base configuration
 * @param source - Configuration to merge in (higher priority)
 * @returns Merged configuration
 */
function mergeConfig(target: Partial<BouncerConfig>, source: Partial<BouncerConfig>): Partial<BouncerConfig> {
  const merged: Partial<BouncerConfig> = { ...target };

  for (const key in source) {
    const sourceValue = source[key as keyof BouncerConfig];
    if (sourceValue !== undefined && sourceValue !== null && sourceValue !== '') {
      (merged as any)[key] = sourceValue;
    }
  }

  return merged;
}

/**
 * Validates the final configuration and throws errors for missing required fields
 * @param config - Configuration to validate
 * @returns Validated configuration
 */
function validateConfig(config: Partial<BouncerConfig>): BouncerConfig {
  const errors: string[] = [];

  // Check required fields
  if (!config.target) {
    errors.push('Target URL is required (provide via --target, TARGET_URL, or config file)');
  }

  if (!config.wallet) {
    errors.push('Wallet address is required (provide via --wallet, WALLET_ADDRESS, or config file)');
  }

  if (!config.privateKey) {
    errors.push('Private key is required (provide via --key, PINION_PRIVATE_KEY, or config file)');
  }

  // Validate formats
  if (config.target) {
    try {
      new URL(config.target);
    } catch {
      errors.push('Target URL must be a valid URL');
    }
  }

  if (config.wallet && !config.wallet.startsWith('0x')) {
    errors.push('Wallet address must start with 0x');
  }

  if (config.privateKey && !config.privateKey.startsWith('0x')) {
    errors.push('Private key must start with 0x');
  }

  if (config.price !== undefined && config.price <= 0) {
    errors.push('Price must be greater than 0');
  }

  if (config.port !== undefined && (config.port <= 0 || config.port > 65535)) {
    errors.push('Port must be between 1 and 65535');
  }

  if (config.network && !['base', 'base-sepolia'].includes(config.network)) {
    errors.push('Network must be "base" or "base-sepolia"');
  }

  // If there are errors, throw them
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  }

  // Return validated config (all fields are now guaranteed to exist)
  return config as BouncerConfig;
}

/**
 * Creates an example configuration file
 * @param filePath - Path where to create the example file
 */
export function createExampleConfig(filePath: string): void {
  const exampleConfig = {
    target: "http://localhost:3000",
    price: 0.01,
    port: 4000,
    wallet: "0xYOUR_WALLET_ADDRESS",
    network: "base-sepolia"
  };

  fs.writeFileSync(filePath, JSON.stringify(exampleConfig, null, 2), 'utf8');
  console.log(`📄 Created example configuration at ${filePath}`);
}
