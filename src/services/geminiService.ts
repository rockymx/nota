import { supabase } from '../lib/supabase';
import { TIMEOUTS, ERROR_MESSAGES } from '../config/constants';

class GeminiService {
  private apiKey: string | null = null;
  private userId: string | null = null;
  private modelName = 'gemini-2.5-flash-latest';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models';
  private errorHandler: any = null;

  constructor() {
    // La API key se cargará cuando se establezca el usuario
  }

  /**
   * Establecer el manejador de errores
   */
  setErrorHandler(errorHandler: any) {
    this.errorHandler = errorHandler;
  }

  /**
   * Establecer el usuario actual y cargar su configuración
   */
  async setUser(userId: string | null) {
    this.userId = userId;
    if (userId) {
      if (this.errorHandler) {
        await this.errorHandler.withDatabaseErrorHandling(
          () => this.loadApiKeyFromSupabase(),
          'load_gemini_api_key'
        );
      } else {
        await this.loadApiKeyFromSupabase();
      }
    } else {
      this.apiKey = null;
    }
  }

  /**
   * Cargar API key desde Supabase de forma segura
   */
  private async loadApiKeyFromSupabase() {
    if (!this.userId) return;

    console.log('🔐 Loading Gemini API key from Supabase...');
    
    const { data, error } = await (supabase as any)
      .from('user_settings')
      .select('gemini_api_key')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    
    this.apiKey = (data as any)?.gemini_api_key || null;
    console.log('✅ Gemini API key loaded from Supabase');
  }

  /**
   * Guardar API key de forma segura en Supabase
   */
  async setApiKey(apiKey: string) {
    if (!this.userId) {
      throw new Error('No user logged in');
    }

    // Validar formato de API key de Gemini
    const trimmedKey = apiKey.trim();

    // Validación básica: debe tener longitud mínima
    if (trimmedKey.length < 20) {
      throw new Error('API key de Gemini inválida. Demasiado corta.');
    }

    // Log para debugging
    console.log('🔑 Setting API key - Length:', trimmedKey.length);
    console.log('🔑 API key prefix:', trimmedKey.substring(0, 4));

    this.apiKey = trimmedKey;

    if (this.errorHandler) {
      return await this.errorHandler.withDatabaseErrorHandling(
        () => this.saveApiKeyToSupabase(trimmedKey),
        'save_gemini_api_key'
      ) !== null;
    } else {
      await this.saveApiKeyToSupabase(trimmedKey);
      return true;
    }
  }

  private async saveApiKeyToSupabase(apiKey: string) {
    console.log('💾 Saving Gemini API key to Supabase...');
    console.log('User ID:', this.userId);

    // Use upsert to handle both insert and update
    const { data, error } = await (supabase as any)
      .from('user_settings')
      .upsert({
        user_id: this.userId,
        gemini_api_key: apiKey,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (error) {
      console.error('❌ Error saving Gemini API key:', error);
      throw error;
    }

    console.log('✅ Gemini API key saved securely to Supabase', data);
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return !!(key && key.trim().length > 0);
  }

  /**
   * Eliminar API key de forma segura de Supabase
   */
  async clearApiKey() {
    if (!this.userId) return false;

    this.apiKey = null;
    
    if (this.errorHandler) {
      return await this.errorHandler.withDatabaseErrorHandling(
        () => this.clearApiKeyFromSupabase(),
        'clear_gemini_api_key'
      ) !== null;
    } else {
      await this.clearApiKeyFromSupabase();
      return true;
    }
  }

  private async clearApiKeyFromSupabase() {
    console.log('🗑️ Removing Gemini API key from Supabase...');

    const { error } = await (supabase as any)
      .from('user_settings')
      .update({
        gemini_api_key: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', this.userId);

    if (error) throw error;

    console.log('✅ Gemini API key removed securely from Supabase');
  }

  async improveNote(content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(ERROR_MESSAGES.AI_NOT_CONFIGURED);
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    const improvePrompt = `Mejora el siguiente texto corrigiendo gramática, ortografía y estilo. Mantén el idioma original y el significado. Solo responde con el texto mejorado, sin explicaciones adicionales:\n\n${content}`;

    if (this.errorHandler) {
      const result = await this.errorHandler.withAIErrorHandling(
        () => this.callGeminiAPI(improvePrompt, 'improve'),
        'improve_note_with_ai'
      );
      if (result === null) {
        throw new Error('No se pudo mejorar la nota');
      }
      return result;
    } else {
      return await this.callGeminiAPI(improvePrompt, 'improve');
    }
  }

  async executePrompt(promptTemplate: string, content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(ERROR_MESSAGES.AI_NOT_CONFIGURED);
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    if (!promptTemplate || promptTemplate.trim().length === 0) {
      throw new Error('El prompt está vacío');
    }

    // Reemplazar variables en el prompt
    const finalPrompt = promptTemplate.replace(/\{content\}/g, content);

    if (this.errorHandler) {
      const result = await this.errorHandler.withAIErrorHandling(
        () => this.callGeminiAPI(finalPrompt, 'execute'),
        'execute_custom_prompt'
      );
      if (result === null) {
        throw new Error('No se pudo ejecutar el prompt');
      }
      return result;
    } else {
      return await this.callGeminiAPI(finalPrompt, 'execute');
    }
  }

  async generateSummary(content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(ERROR_MESSAGES.AI_NOT_CONFIGURED);
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    const summaryPrompt = `Crea un resumen conciso del siguiente texto en máximo 2-3 oraciones. Mantén el idioma original:\n\n${content}`;

    if (this.errorHandler) {
      const result = await this.errorHandler.withAIErrorHandling(
        () => this.callGeminiAPI(summaryPrompt, 'summary'),
        'generate_summary'
      );
      if (result === null) {
        throw new Error('No se pudo generar el resumen');
      }
      return result;
    } else {
      return await this.callGeminiAPI(summaryPrompt, 'summary');
    }
  }

  async generateTitle(content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(ERROR_MESSAGES.AI_NOT_CONFIGURED);
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    const titlePrompt = `Genera un título corto y descriptivo (máximo 6 palabras) para el siguiente contenido. Solo responde con el título, sin comillas ni explicaciones:\n\n${content.substring(0, 500)}`;

    if (this.errorHandler) {
      const result = await this.errorHandler.withAIErrorHandling(
        () => this.callGeminiAPI(titlePrompt, 'title'),
        'generate_title'
      );
      if (result === null) {
        throw new Error('No se pudo generar el título');
      }
      return result;
    } else {
      return await this.callGeminiAPI(titlePrompt, 'title');
    }
  }

  /**
   * Método centralizado para llamadas a la API de Gemini
   */
  private async callGeminiAPI(prompt: string, operation: string): Promise<string> {
    console.log(`🤖 ${operation} with Gemini...`);
    console.log(`🔗 Using model: ${this.modelName}`);
    console.log(`🔑 API Key present: ${this.apiKey ? 'Yes' : 'No'}`);
    console.log(`🔑 API Key starts with: ${this.apiKey?.substring(0, 8)}...`);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), TIMEOUTS.AI_API)
    );

    const fullUrl = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
    console.log(`🌐 Full URL: ${fullUrl.replace(this.apiKey || '', 'API_KEY_HIDDEN')}`);

    const apiPromise = fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: this.getGenerationConfig(operation),
      })
    });

    const response = await Promise.race([apiPromise, timeoutPromise]) as Response;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API error:');
      console.error('   Status:', response.status);
      console.error('   Status Text:', response.statusText);
      console.error('   Response:', errorText);
      console.error('   URL used:', fullUrl.replace(this.apiKey || '', 'API_KEY_HIDDEN'));

      if (response.status === 400) {
        throw new Error(ERROR_MESSAGES.AI_INVALID_KEY);
      } else if (response.status === 403) {
        throw new Error(ERROR_MESSAGES.AI_INVALID_KEY);
      } else if (response.status === 404) {
        throw new Error('Modelo de IA no disponible. Verifica tu API key.');
      } else if (response.status === 429) {
        throw new Error(ERROR_MESSAGES.AI_QUOTA_EXCEEDED);
      } else {
        throw new Error(`Error del servidor de IA: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('📦 Raw API Response:', JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No candidates in response:', data);
      throw new Error(`No se pudo generar respuesta para ${operation}`);
    }

    const result = data.candidates[0].content.parts[0].text;
    console.log(`✅ ${operation} completed successfully`);
    console.log(`📝 Result length: ${result.length} characters`);
    return result;
  }

  /**
   * Configuración específica según el tipo de operación
   */
  private getGenerationConfig(operation: string) {
    switch (operation) {
      case 'title':
        return {
          temperature: 0.5,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 50,
        };
      case 'summary':
        return {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 256,
        };
      default:
        return {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        };
    }
  }
}

export const geminiService = new GeminiService();