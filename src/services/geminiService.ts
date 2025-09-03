import { supabase } from '../lib/supabase';

class GeminiService {
  private apiKey: string | null = null;
  private userId: string | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    // La API key se cargará cuando se establezca el usuario
  }

  /**
   * Establecer el usuario actual y cargar su configuración
   */
  async setUser(userId: string | null) {
    this.userId = userId;
    if (userId) {
      await this.loadApiKeyFromSupabase();
    } else {
      this.apiKey = null;
    }
  }

  /**
   * Cargar API key desde Supabase de forma segura
   */
  private async loadApiKeyFromSupabase() {
    if (!this.userId) return;

    try {
      console.log('🔐 Loading Gemini API key from Supabase...');
      
      const { data, error } = await (supabase as any)
        .from('user_settings')
        .select('gemini_api_key')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (error) {
        throw error;
      } else {
        this.apiKey = (data as any)?.gemini_api_key || null;
        console.log('✅ Gemini API key loaded from Supabase');
      }
    } catch (error) {
      console.error('❌ Error loading API key from Supabase:', error);
      this.apiKey = null;
    }
  }

  /**
   * Guardar API key de forma segura en Supabase
   */
  async setApiKey(apiKey: string) {
    if (!this.userId) {
      console.error('❌ Cannot save API key: no user logged in');
      return false;
    }

    this.apiKey = apiKey;
    
    try {
      console.log('💾 Saving Gemini API key to Supabase...');
      
      // Intentar actualizar primero
      const { error: updateError } = await (supabase as any)
        .from('user_settings')
        .update({ 
          gemini_api_key: apiKey,
          updated_at: new Date().toISOString()
        } as any)
        .eq('user_id', this.userId);

      if (updateError) {
        if (updateError.code === 'PGRST116') {
          // No existe registro, crear uno nuevo
          const { error: insertError } = await (supabase as any)
            .from('user_settings')
            .insert({
              user_id: this.userId,
              gemini_api_key: apiKey,
            });

          if (insertError) throw insertError;
        } else {
          throw updateError;
        }
      }

      console.log('✅ Gemini API key saved securely to Supabase');
      return true;
    } catch (error) {
      console.error('❌ Error saving API key to Supabase:', error);
      return false;
    }
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
    
    try {
      console.log('🗑️ Removing Gemini API key from Supabase...');
      
      const { error } = await (supabase as any)
        .from('user_settings')
        .update({ 
          gemini_api_key: null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('user_id', this.userId);

      if (error) throw error;
      
      console.log('✅ Gemini API key removed securely from Supabase');
      return true;
    } catch (error) {
      console.error('❌ Error removing API key from Supabase:', error);
      return false;
    }
  }

  async improveNote(content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('API key de Gemini no configurada');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    try {
      console.log('🤖 Mejorando nota con Gemini...');
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Mejora y organiza el siguiente texto de nota manteniendo el contenido original pero haciéndolo más claro, estructurado y fácil de leer. Mantén el idioma original y no agregues información nueva:\n\n${content}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        
        if (response.status === 400) {
          throw new Error('API key inválida o solicitud mal formada');
        } else if (response.status === 403) {
          throw new Error('API key sin permisos o cuota excedida');
        } else if (response.status === 429) {
          throw new Error('Límite de solicitudes excedido. Intenta más tarde');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No se pudo generar una respuesta');
      }

      const improvedText = data.candidates[0].content.parts[0].text;
      console.log('✅ Nota mejorada con éxito');
      return improvedText;
      
    } catch (error) {
      console.error('❌ Error mejorando nota con IA:', error);
      throw error;
    }
  }

  async executePrompt(promptTemplate: string, content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('API key de Gemini no configurada');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    if (!promptTemplate || promptTemplate.trim().length === 0) {
      throw new Error('El prompt está vacío');
    }

    try {
      console.log('🤖 Ejecutando prompt personalizado con Gemini...');
      
      // Reemplazar variables en el prompt
      const finalPrompt = promptTemplate.replace(/\{content\}/g, content);
      
      console.log('📝 Prompt template:', promptTemplate);
      console.log('📄 Content length:', content.length);
      console.log('🔄 Final prompt preview:', finalPrompt.substring(0, 200) + '...');
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: finalPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        
        if (response.status === 400) {
          throw new Error('API key inválida o solicitud mal formada');
        } else if (response.status === 403) {
          throw new Error('API key sin permisos o cuota excedida');
        } else if (response.status === 429) {
          throw new Error('Límite de solicitudes excedido. Intenta más tarde');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No se pudo generar una respuesta');
      }

      const result = data.candidates[0].content.parts[0].text;
      console.log('✅ Prompt ejecutado con éxito');
      return result;
      
    } catch (error) {
      console.error('❌ Error ejecutando prompt con IA:', error);
      throw error;
    }
  }

  async generateSummary(content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('API key de Gemini no configurada');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    try {
      console.log('📝 Generando resumen con Gemini...');
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Crea un resumen conciso del siguiente texto en máximo 2-3 oraciones. Mantén el idioma original:\n\n${content}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 256,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        
        if (response.status === 400) {
          throw new Error('API key inválida o solicitud mal formada');
        } else if (response.status === 403) {
          throw new Error('API key sin permisos o cuota excedida');
        } else if (response.status === 429) {
          throw new Error('Límite de solicitudes excedido. Intenta más tarde');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No se pudo generar un resumen');
      }

      const summary = data.candidates[0].content.parts[0].text;
      console.log('✅ Resumen generado con éxito');
      return summary;
      
    } catch (error) {
      console.error('❌ Error generando resumen con IA:', error);
      throw error;
    }
  }

  async generateTitle(content: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('API key de Gemini no configurada');
    }

    if (!content || content.trim().length === 0) {
      throw new Error('El contenido de la nota está vacío');
    }

    try {
      console.log('🏷️ Generando título con Gemini...');
      
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Genera un título corto y descriptivo (máximo 6 palabras) para el siguiente contenido. Solo responde con el título, sin comillas ni explicaciones:\n\n${content.substring(0, 500)}`
            }]
          }],
          generationConfig: {
            temperature: 0.5,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 50,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API error:', response.status, errorText);
        throw new Error(`Error generando título: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No se pudo generar un título');
      }

      const title = data.candidates[0].content.parts[0].text.trim();
      console.log('✅ Título generado con éxito');
      return title;
      
    } catch (error) {
      console.error('❌ Error generando título con IA:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();