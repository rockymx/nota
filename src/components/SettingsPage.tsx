import { useState, useEffect } from 'react';
import { ArrowLeft, User, Sparkles, Palette, BarChart3, Download, Upload, MessageSquare } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AIPrompt } from '../types';
import { geminiService } from '../services/geminiService';
import { auth, supabase } from '../lib/supabase';
import { PromptsManagement } from './PromptsManagement';

interface SettingsPageProps {
  user: SupabaseUser;
  onBack: () => void;
  totalNotes: number;
  totalFolders: number;
  aiPrompts: AIPrompt[];
  hiddenPromptIds: Set<string>;
  onCreatePrompt: (name: string, description: string, promptTemplate: string, category: string) => Promise<AIPrompt | null>;
  onUpdatePrompt: (id: string, updates: Partial<Pick<AIPrompt, 'name' | 'description' | 'promptTemplate' | 'category'>>) => Promise<void>;
  onDeletePrompt: (id: string) => Promise<void>;
  onHideDefaultPrompt: (promptId: string) => Promise<void>;
  onShowDefaultPrompt: (promptId: string) => Promise<void>;
}

type SettingsTab = 'profile' | 'ai' | 'prompts' | 'preferences' | 'data';

export function SettingsPage({ 
  user, 
  onBack, 
  totalNotes, 
  totalFolders,
  aiPrompts,
  hiddenPromptIds,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onHideDefaultPrompt,
  onShowDefaultPrompt
}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [apiKey, setApiKey] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [autoSave, setAutoSave] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    // Cargar configuraciones cuando el usuario cambia
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    try {
      // Establecer usuario en el servicio de Gemini
      await geminiService.setUser(user.id);
      
      // Cargar API key desde Supabase
      const existingKey = geminiService.getApiKey();
      if (existingKey) {
        setApiKey(existingKey);
      }

      // Cargar configuraciones desde Supabase
      const { data, error } = await (supabase as any)
        .from('user_settings')
        .select('theme, auto_save')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user settings:', error);
      } else if (data) {
        setTheme((data as any).theme as 'light' | 'dark');
        setAutoSave((data as any).auto_save);
        applyTheme((data as any).theme as 'light' | 'dark');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const body = document.body;
    if (newTheme === 'dark') {
      body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
  };
  
  const handleSaveAI = async () => {
    if (apiKey.trim()) {
      const success = await geminiService.setApiKey(apiKey.trim());
      if (success) {
        setTestResult('✅ API key guardada correctamente en la nube');
      } else {
        setTestResult('❌ Error guardando API key');
      }
    }
  };

  const handleTestAPI = async () => {
    if (!apiKey.trim()) {
      setTestResult('❌ Ingresa una API key primero');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      await geminiService.setUser(user.id);
      await geminiService.setApiKey(apiKey.trim());
      
      await geminiService.improveNote('Esta es una prueba de la API de Gemini.');
      setTestResult('✅ API key válida y funcionando');
      
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'API key inválida'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    
    // Guardar en Supabase
    try {
      const { error } = await (supabase as any)
        .from('user_settings')
        .upsert({
          user_id: user.id,
          theme: newTheme,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      console.log('✅ Theme saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving theme:', error);
    }
  };

  const handleAutoSaveChange = async (enabled: boolean) => {
    setAutoSave(enabled);
    
    // Guardar en Supabase
    try {
      const { error } = await (supabase as any)
        .from('user_settings')
        .upsert({
          user_id: user.id,
          auto_save: enabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      console.log('✅ Auto-save preference saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving auto-save preference:', error);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: User },
    { id: 'ai' as const, label: 'Inteligencia Artificial', icon: Sparkles },
    { id: 'prompts' as const, label: 'Prompts de IA', icon: MessageSquare },
    { id: 'preferences' as const, label: 'Preferencias', icon: Palette },
    { id: 'data' as const, label: 'Datos', icon: BarChart3 },
  ];

  return (
    <div className="h-full bg-app flex flex-col transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-app p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-app-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-app-secondary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-app-primary">Configuración</h1>
            <p className="text-app-secondary">Administra tu cuenta y preferencias</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-app">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-app-secondary hover:text-app-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-app-primary mb-4">Información de la cuenta</h2>
              <div className="bg-app-secondary rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-app-primary mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-app rounded-lg bg-app-tertiary text-app-secondary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-app-primary mb-1">
                    ID de usuario
                  </label>
                  <input
                    type="text"
                    value={user.id}
                    disabled
                    className="w-full px-3 py-2 border border-app rounded-lg bg-app-tertiary text-app-secondary font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-app-primary mb-3">Acciones de cuenta</h3>
              <div className="space-y-3">
                {['2dcommx02@gmail.com', '2dcommx01@gmail.com'].includes(user.email || '') && (
                  <a
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <div className="w-4 h-4 bg-white rounded flex items-center justify-center">
                      <span className="text-purple-500 text-xs font-bold">A</span>
                    </div>
                    Panel de Administrador
                  </a>
                )}
                <button
                  onClick={() => auth.signOut()}
                  className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-app-primary mb-4">Configuración de IA</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Google Gemini API</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Configura tu API key para usar funciones de IA como mejorar notas y generar títulos automáticos.
                </p>
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Obtener API Key →
                </a>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-app-primary mb-2">
                    API Key de Gemini
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Ingresa tu API key..."
                    className="w-full px-3 py-2 border border-app rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-app text-app-primary placeholder-app-tertiary"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleTestAPI}
                    disabled={!apiKey.trim() || testLoading}
                    className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testLoading ? 'Probando...' : 'Probar API'}
                  </button>
                  <button
                    onClick={handleSaveAI}
                    disabled={!apiKey.trim()}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Guardar
                  </button>
                  {geminiService.isConfigured() && (
                    <button
                      onClick={() => {
                        geminiService.clearApiKey();
                        setApiKey('');
                        setTestResult(null);
                      }}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-sm ${
                    testResult.startsWith('✅') 
                      ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                  }`}>
                    {testResult}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="max-w-4xl">
            <PromptsManagement
              prompts={aiPrompts}
              hiddenPromptIds={hiddenPromptIds}
              onCreatePrompt={onCreatePrompt}
              onUpdatePrompt={onUpdatePrompt}
              onDeletePrompt={onDeletePrompt}
              onHideDefaultPrompt={onHideDefaultPrompt}
              onShowDefaultPrompt={onShowDefaultPrompt}
            />
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-app-primary mb-4">Preferencias de la aplicación</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-app-primary mb-3">Apariencia</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-app-primary mb-2">
                        Tema
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleThemeChange('light')}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            theme === 'light'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-app hover:bg-app-secondary text-app-primary'
                          }`}
                        >
                          Claro
                        </button>
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            theme === 'dark'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'border-app hover:bg-app-secondary text-app-primary'
                          }`}
                        >
                          Oscuro
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-app-primary mb-3">Editor</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={autoSave}
                        onChange={(e) => handleAutoSaveChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-app-primary">Guardado automático</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-app-primary mb-4">Gestión de datos</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-app-primary mb-3">Estadísticas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Total de notas</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalNotes}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-300">Total de carpetas</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalFolders}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-app-primary mb-3">Exportar datos</h3>
                  <div className="space-y-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-app rounded-lg hover:bg-app-secondary transition-colors text-app-primary">
                      <Download className="w-4 h-4" />
                      Exportar todas las notas (JSON)
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-app rounded-lg hover:bg-app-secondary transition-colors text-app-primary">
                      <Download className="w-4 h-4" />
                      Exportar como Markdown
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-app-primary mb-3">Importar datos</h3>
                  <div className="space-y-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-app rounded-lg hover:bg-app-secondary transition-colors text-app-primary">
                      <Upload className="w-4 h-4" />
                      Importar notas desde archivo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}