import mongoose from 'mongoose';

/**
 * Ensures all models are properly registered in serverless environments
 * This prevents "Schema hasn't been registered for model" errors
 */
export async function ensureModelsRegistered() {
  try {
    // Import models to ensure they are registered
    const models = [
      () => import('@/models/User'),
      () => import('@/models/Madangal'),
      () => import('@/models/Announcement'),
      () => import('@/models/Temple'),
      () => import('@/models/Group'),
      () => import('@/models/Device'),
      () => import('@/models/Gallery'),
      () => import('@/models/Notification'),
      () => import('@/models/Quote'),
      () => import('@/models/Song'),
      () => import('@/models/Annadhanam'),
      () => import('@/models/UserSupport'),
      () => import('@/models/City'),
      () => import('@/models/Country'),
      () => import('@/models/State'),
    ];

    // Import all models in parallel
    await Promise.all(models.map(importModel => importModel()));
    
    console.log('✅ All models registered successfully');
    console.log('📊 Registered models:', Object.keys(mongoose.models));
    
    return true;
  } catch (error) {
    console.error('❌ Error registering models:', error);
    throw error;
  }
}

/**
 * Check if a specific model is registered
 */
export function isModelRegistered(modelName: string): boolean {
  return !!mongoose.models[modelName];
}

/**
 * Get all registered model names
 */
export function getRegisteredModels(): string[] {
  return Object.keys(mongoose.models);
}
