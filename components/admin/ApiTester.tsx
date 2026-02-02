import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Copy,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminTheme } from '../../hooks/useAdminTheme';
interface ApiConnection {
  id: string;
  name: string;
  provider: string;
  base_url: string;
  api_key: string;
  additional_config: {
    headers?: Record<string, string>;
    endpoints?: Record<string, string>;
  };
}
interface TestResult {
  success: boolean;
  status: number;
  responseTime: number;
  data: any;
  error?: string;
}
const ApiTester: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ApiConnection | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [customParams, setCustomParams] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingConnections, setIsFetchingConnections] = useState(true);
  const [result, setResult] = useState<TestResult | null>(null);

  // Theme classes
  const t = {
    cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
    cardBorder: isDark ? 'border-zinc-800' : 'border-zinc-200',
    textPrimary: isDark ? 'text-zinc-100' : 'text-zinc-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-zinc-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-zinc-500',
    inputBg: isDark ? 'bg-zinc-800' : 'bg-zinc-50',
    inputBorder: isDark ? 'border-zinc-700' : 'border-zinc-300',
    inputText: isDark ? 'text-zinc-100' : 'text-zinc-900',
    placeholder: isDark ? 'placeholder-zinc-600' : 'placeholder-zinc-400',
    codeBg: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    codeText: isDark ? 'text-zinc-300' : 'text-zinc-700',
    buttonBg: isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200',
    buttonText: isDark ? 'text-zinc-300' : 'text-zinc-700',
    iconMuted: isDark ? 'text-zinc-700' : 'text-zinc-300',
    copyButton: isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200',
  };
  useEffect(() => {
    loadConnections();
  }, []);
  const loadConnections = async () => {
    setIsFetchingConnections(true);
    const { data, error } = await supabase
      .from('api_connections')
      .select('*')
      .eq('is_active', true);
    if (data) {
      setConnections(data);
      if (data.length > 0) {
        setSelectedConnection(data[0]);
        const endpoints = data[0].additional_config?.endpoints;
        if (endpoints) {
          setSelectedEndpoint(Object.keys(endpoints)[0] || '');
        }
      }
    }
    setIsFetchingConnections(false);
  };
  const runTest = async () => {
    if (!selectedConnection || !selectedEndpoint) return;
    setIsLoading(true);
    setResult(null);
    const startTime = performance.now();
    try {
      const endpoints = selectedConnection.additional_config?.endpoints || {};
      let endpointPath = endpoints[selectedEndpoint] || selectedEndpoint;
      // Add custom params if provided
      if (customParams) {
        endpointPath += (endpointPath.includes('?') ? '&' : '?') + customParams;
      }
      const fullUrl = selectedConnection.base_url + endpointPath;
      // Call our edge function to proxy the request (avoids CORS)
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('test-api', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          url: fullUrl,
          method: 'GET',
          headers: {
            'authorization': `apikey ${selectedConnection.api_key}`,
            'content-type': 'application/json',
            ...selectedConnection.additional_config?.headers
          },
          connection_id: selectedConnection.id
        }
      });
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      if (error) {
        setResult({
          success: false,
          status: 500,
          responseTime,
          data: null,
          error: error.message
        });
      } else {
        setResult({
          success: data.success,
          status: data.status,
          responseTime,
          data: data.body,
          error: data.error
        });
      }
      // Update last_tested on connection
      await supabase
        .from('api_connections')
        .update({ 
          last_tested_at: new Date().toISOString(),
          last_test_success: data?.success ?? false,
          last_test_message: data?.error || 'OK'
        })
        .eq('id', selectedConnection.id);
    } catch (err: any) {
      const endTime = performance.now();
      setResult({
        success: false,
        status: 0,
        responseTime: Math.round(endTime - startTime),
        data: null,
        error: err.message || 'Network error'
      });
    }
    setIsLoading(false);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  const endpoints = selectedConnection?.additional_config?.endpoints || {};
  if (isFetchingConnections) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`w-6 h-6 ${t.textMuted} animate-spin`} />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-xl font-semibold ${t.textPrimary}`}>API Tester</h1>
        <p className={`${t.textMuted} text-sm mt-1`}>Test API connections and endpoints</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
          <div className={`px-4 py-3 border-b ${t.cardBorder}`}>
            <h2 className={`text-sm font-medium ${t.textPrimary}`}>Request</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Connection Selector */}
            <div className="space-y-2">
              <label className={`block text-xs font-medium ${t.textSecondary}`}>API Connection</label>
              <div className="relative">
                <select
                  value={selectedConnection?.id || ''}
                  onChange={(e) => {
                    const conn = connections.find(c => c.id === e.target.value);
                    setSelectedConnection(conn || null);
                    if (conn?.additional_config?.endpoints) {
                      setSelectedEndpoint(Object.keys(conn.additional_config.endpoints)[0] || '');
                    }
                  }}
                  className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                >
                  {connections.map(conn => (
                    <option key={conn.id} value={conn.id}>{conn.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`} />
              </div>
            </div>
            {/* Endpoint Selector */}
            <div className="space-y-2">
              <label className={`block text-xs font-medium ${t.textSecondary}`}>Endpoint</label>
              <div className="relative">
                <select
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                >
                  {Object.entries(endpoints).map(([key, path]) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`} />
              </div>
              <p className={`text-xs ${t.textMuted} font-mono`}>
                {selectedConnection?.base_url}{endpoints[selectedEndpoint]}
              </p>
            </div>
            {/* Custom Parameters */}
            <div className="space-y-2">
              <label className={`block text-xs font-medium ${t.textSecondary}`}>
                Query Parameters <span className={t.textMuted}>(optional)</span>
              </label>
              <input
                type="text"
                value={customParams}
                onChange={(e) => setCustomParams(e.target.value)}
                placeholder="numbers=12,33,54,57,60&pb=12"
                className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
              />
            </div>
            {/* Run Button */}
            <button
              onClick={runTest}
              disabled={isLoading || !selectedConnection}
              className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 ${isDark ? 'disabled:bg-zinc-700 disabled:text-zinc-500' : 'disabled:bg-zinc-300 disabled:text-zinc-500'} text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run Test
                </>
              )}
            </button>
          </div>
        </div>
        {/* Response Panel */}
        <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
          <div className={`px-4 py-3 border-b ${t.cardBorder} flex items-center justify-between`}>
            <h2 className={`text-sm font-medium ${t.textPrimary}`}>Response</h2>
            {result && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock size={12} className={t.textMuted} />
                  <span className={t.textSecondary}>{result.responseTime}ms</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  result.success
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {result.status || 'ERR'}
                </span>
              </div>
            )}
          </div>
          <div className="p-4">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Zap size={24} className={t.iconMuted} />
                <p className={`${t.textMuted} text-sm mt-2`}>Run a test to see the response</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${result.success ? 'text-emerald-500' : 'text-red-500'}`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {/* Error Message */}
                {result.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-red-500 text-sm">{result.error}</p>
                  </div>
                )}
                {/* Response Data */}
                {result.data && (
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                      className={`absolute top-2 right-2 p-1.5 ${t.copyButton} rounded transition-colors`}
                    >
                      <Copy size={14} />
                    </button>
                    <pre className={`p-3 ${t.codeBg} rounded-md text-xs ${t.codeText} overflow-auto max-h-64 font-mono`}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Quick Tests */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-4`}>
        <h3 className={`text-sm font-medium ${t.textPrimary} mb-3`}>Quick Tests</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedEndpoint('powerball_results');
              setCustomParams('');
            }}
            className={`px-3 py-1.5 ${t.buttonBg} ${t.buttonText} text-xs rounded-md transition-colors`}
          >
            Get Powerball Results
          </button>
          <button
            onClick={() => {
              setSelectedEndpoint('powerball_checker');
              setCustomParams('numbers=12,33,54,57,60&pb=12');
            }}
            className={`px-3 py-1.5 ${t.buttonBg} ${t.buttonText} text-xs rounded-md transition-colors`}
          >
            Check Powerball Numbers
          </button>
          <button
            onClick={() => {
              setSelectedEndpoint('mega_millions_results');
              setCustomParams('');
            }}
            className={`px-3 py-1.5 ${t.buttonBg} ${t.buttonText} text-xs rounded-md transition-colors`}
          >
            Get Mega Millions Results
          </button>
        </div>
      </div>
    </div>
  );
};
export default ApiTester;
