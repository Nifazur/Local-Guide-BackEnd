import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

interface IConfig {
  nodeEnv: string;
  port: number;
  jwt: {
    secret: string;
    expiresIn: string;
    cookieExpiresIn: number;
  };
  databaseUrl: string;
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
  };
  frontendUrl: string;
}

const config: IConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-default-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieExpiresIn: parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7', 10),
  },
  
  databaseUrl: process.env.DATABASE_URL || '',
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0 && config.nodeEnv === 'production') {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

export default config;