import dotenv from 'dotenv';

dotenv.config();

export const azureConfig = {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini-desafia"
};

// Validar configurações
if (!azureConfig.endpoint || !azureConfig.apiKey) {
    throw new Error('Azure OpenAI credentials não configuradas no .env');
}