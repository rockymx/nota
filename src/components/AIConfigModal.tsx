import { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface AIConfigModalProps {
  onClose: () => void;
  userId: string;
}

export function AIConfigModal({ onClose, userId }: AIConfigModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadApiKey();
  }, [userId]);

  const loadApiKey = async () => {
    try {
      await geminiService.setUser(userId);
      const existingKey = geminiService.getApiKey();
      if (existingKey) {
        setApiKey(existingKey);
        setIsConfigured(true);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const handleSave = async () => {
    if (apiKey.trim()) {
      const success = await geminiService.setApiKey(apiKey.trim());
      if (success) {
        setIsConfigured(true);
        setTestResult('✅ API key guardada correctamente en la nube');
      } else {
        setTestResult('❌ Error guardando API key');
      }
    }
  };

  const handleRemove = async () => {
    const success = await geminiService.clearApiKey();
    if (success) {
      setApiKey('');
      setIsConfigured(false);
      setTestResult('✅ API key eliminada correctamente');
    } else {
      setTestResult('❌ Error eliminando API key');
    }
  };

  const handleTestAPI = async () => {
    if (!apiKey.trim()) {
      setTestResult('Ingresa una API key primero');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 INICIANDO PRUEBA DE API KEY...');
      console.log('🔑 API Key length:', apiKey.trim().length);
      console.log('🔑 API Key starts with:', apiKey.trim().substring(0, 8));

      // Guardar temporalmente la API key para probar
      await geminiService.setUser(userId);
      console.log('✅ User set in geminiService');

      await geminiService.setApiKey(apiKey.trim());
      console.log('✅ API key set in geminiService');

      // Probar con un texto simple
      console.log('🤖 Calling improveNote...');
      const result = await geminiService.improveNote('Esta es una prueba de la API de Gemini.');
      console.log('✅ API call successful! Result:', result);

      setTestResult('✅ API key válida y funcionando');
      setIsConfigured(true);

    } catch (error) {
      console.error('❌ TEST FAILED:', error);
      const errorMessage = error instanceof Error ? error.message : 'API key inválida';
      console.error('❌ Error message:', errorMessage);
      setTestResult(`❌ Error: ${errorMessage}`);
      setIsConfigured(false);
    } finally {
      setTestLoading(false);
      console.log('🏁 Test completed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Configurar IA</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-medium text-purple-900 mb-2">Google Gemini API</h3>
            <p className="text-sm text-purple-700 mb-3">
              Configura tu API key de Google Gemini para usar funciones de IA como mejorar notas y generar resúmenes.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Obtener API Key
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key de Gemini
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingresa tu API key..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
            />
          </div>

          {/* Botón para probar API */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestAPI}
              disabled={!apiKey.trim() || testLoading}
              className="flex-1 px-3 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {testLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  Probando...
                </div>
              ) : (
                'Probar API'
              )}
            </button>
          </div>

          {/* Resultado de la prueba */}
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.startsWith('✅') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {testResult}
            </div>
          )}

          {isConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                Tu API key se guarda de forma segura en la nube y está encriptada.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {isConfigured && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                Remover
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
            {isConfigured && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Listo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}