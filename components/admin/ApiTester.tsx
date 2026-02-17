import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Clock,
  Check,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Copy,
  Loader2,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminTheme, getAdminTheme } from '../../hooks/useAdminTheme';

interface ApiConnection {
  id: string;
  name: string;
  provider: string;
  base_url: string;
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
  requestUrl?: string;
  requestMethod?: string;
  endpointKey?: string;
  paramsUsed?: string;
}

// -- Endpoint documentation --------------------------------------------------

interface EndpointParam {
  name: string;
  required: boolean;
  description: string;
  example: string;
}

interface EndpointDoc {
  description: string;
  params?: EndpointParam[];
  exampleParams?: string;
  notes?: string;
}

const ENDPOINT_DOCS: Record<string, EndpointDoc> = {
  powerball_results: {
    description: 'Fetches the latest Powerball drawing results.',
    notes: 'No parameters needed — returns the most recent draw.',
  },
  powerball_checker: {
    description: 'Checks if given numbers match the latest Powerball draw.',
    params: [
      { name: 'numbers', required: true, description: '5 main numbers, comma-separated', example: '12,33,54,57,60' },
      { name: 'pb', required: true, description: 'Powerball number', example: '12' },
    ],
    exampleParams: 'numbers=12,33,54,57,60&pb=12',
    notes: 'Returns 500 if numbers or pb param is missing.',
  },
  mega_millions_results: {
    description: 'Fetches the latest Mega Millions drawing results.',
    notes: 'No parameters needed — returns the most recent draw.',
  },
  mega_millions_checker: {
    description: 'Checks if given numbers match the latest Mega Millions draw.',
    params: [
      { name: 'numbers', required: true, description: '5 main numbers, comma-separated', example: '12,33,54,57,60' },
      { name: 'mb', required: true, description: 'Mega Ball number', example: '12' },
    ],
    exampleParams: 'numbers=12,33,54,57,60&mb=12',
    notes: 'Returns 500 if numbers or mb param is missing.',
  },
};

// -- Quick tests -------------------------------------------------------------

interface QuickTest {
  label: string;
  description: string;
  endpoint: string;
  params: string;
}

const QUICK_TESTS: QuickTest[] = [
  {
    label: 'Powerball Results',
    description: 'Fetch latest drawing — no params needed',
    endpoint: 'powerball_results',
    params: '',
  },
  {
    label: 'Powerball Checker',
    description: 'Check sample numbers against latest draw',
    endpoint: 'powerball_checker',
    params: 'numbers=12,33,54,57,60&pb=12',
  },
  {
    label: 'Mega Millions Results',
    description: 'Fetch latest drawing — no params needed',
    endpoint: 'mega_millions_results',
    params: '',
  },
];

// -- Error hint helper -------------------------------------------------------

function getErrorHint(endpointKey: string, status: number, paramsUsed: string): string | null {
  if (status >= 500) {
    const doc = ENDPOINT_DOCS[endpointKey];
    if (doc?.params && doc.params.some(p => p.required)) {
      const missing = doc.params
        .filter(p => p.required)
        .filter(p => !paramsUsed.includes(p.name + '='));
      if (missing.length > 0) {
        const suggestion = doc.exampleParams || missing.map(p => `${p.name}=${p.example}`).join('&');
        return `Missing required param${missing.length > 1 ? 's' : ''}: ${missing.map(p => p.name).join(', ')}. Try: ${suggestion}`;
      }
    }
    return 'Server returned 500. This usually means missing/malformed parameters or a temporary API issue.';
  }
  if (status === 401 || status === 403) {
    return 'Authentication issue — the API key may be invalid or expired. Check the api_connections table.';
  }
  return null;
}

// -- Component ---------------------------------------------------------------

const ApiTester: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [connections, setConnections] = useState<ApiConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ApiConnection | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [customParams, setCustomParams] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingConnections, setIsFetchingConnections] = useState(true);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = getAdminTheme(isDark);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setIsFetchingConnections(true);
    const { data, error } = await supabase
      .from('api_connections')
      .select('id, name, provider, base_url, additional_config')
      .eq('is_active', true);
    if (error) {
      setConnectionsError(error.message || 'Failed to load API connections');
    } else if (data) {
      setConnectionsError(null);
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

  const runTest = async (overrideEndpoint?: string, overrideParams?: string) => {
    const effectiveEndpoint = overrideEndpoint ?? selectedEndpoint;
    const effectiveParams = overrideParams ?? customParams;
    if (!selectedConnection || !effectiveEndpoint) return;

    setIsLoading(true);
    setResult(null);
    const startTime = performance.now();

    // Build URL up front so it's available even on error
    const endpointsMap = selectedConnection.additional_config?.endpoints || {};
    let endpointPath = endpointsMap[effectiveEndpoint] || effectiveEndpoint;
    if (effectiveParams) {
      endpointPath += (endpointPath.includes('?') ? '&' : '?') + effectiveParams;
    }
    const fullUrl = selectedConnection.base_url + endpointPath;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('test-api', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          url: fullUrl,
          method: 'GET',
          connection_id: selectedConnection.id
        }
      });

      const responseTime = Math.round(performance.now() - startTime);

      if (error) {
        setResult({
          success: false,
          status: 500,
          responseTime,
          data: null,
          error: error.message,
          requestUrl: fullUrl,
          requestMethod: 'GET',
          endpointKey: effectiveEndpoint,
          paramsUsed: effectiveParams,
        });
      } else {
        setResult({
          success: data.success,
          status: data.status,
          responseTime,
          data: data.body,
          error: data.error,
          requestUrl: fullUrl,
          requestMethod: 'GET',
          endpointKey: effectiveEndpoint,
          paramsUsed: effectiveParams,
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
      setResult({
        success: false,
        status: 0,
        responseTime: Math.round(performance.now() - startTime),
        data: null,
        error: err.message || 'Network error',
        requestUrl: fullUrl,
        requestMethod: 'GET',
        endpointKey: effectiveEndpoint,
        paramsUsed: effectiveParams,
      });
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      setCopiedId('error');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const endpoints = selectedConnection?.additional_config?.endpoints || {};
  const currentDoc = ENDPOINT_DOCS[selectedEndpoint];

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
            {/* Connection Error */}
            {connectionsError && (
              <div className={`flex items-center justify-between p-3 rounded-md border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-red-500 text-sm">{connectionsError}</p>
                </div>
                <button onClick={loadConnections} className="flex items-center gap-1 text-red-500 hover:text-red-400 text-xs font-medium shrink-0">
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}

            {/* Connection Selector */}
            <div className="space-y-2">
              <label htmlFor="api-connection" className={`block text-xs font-medium ${t.textSecondary}`}>API Connection</label>
              <div className="relative">
                <select
                  id="api-connection"
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
              <label htmlFor="api-endpoint" className={`block text-xs font-medium ${t.textSecondary}`}>Endpoint</label>
              <div className="relative">
                <select
                  id="api-endpoint"
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                >
                  {Object.entries(endpoints).map(([key]) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`} />
              </div>
              <p className={`text-xs ${t.textMuted} font-mono`}>
                {selectedConnection?.base_url}{endpoints[selectedEndpoint]}
              </p>

              {/* Endpoint Documentation */}
              {currentDoc && (
                <div className={`p-3 ${t.rowBg} rounded-md space-y-2`}>
                  <div className="flex items-start gap-2">
                    <Info size={14} className={`${t.textMuted} shrink-0 mt-0.5`} />
                    <p className={`text-xs ${t.textSecondary}`}>{currentDoc.description}</p>
                  </div>
                  {currentDoc.params && currentDoc.params.length > 0 && (
                    <div className="space-y-1.5 pl-5">
                      <p className={`text-[10px] font-medium ${t.textMuted} uppercase tracking-wider`}>Parameters</p>
                      {currentDoc.params.map(p => (
                        <div key={p.name} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                          <code className={`${t.codeText} font-mono font-medium`}>{p.name}</code>
                          {p.required && (
                            <span className="text-red-500 text-[10px] font-medium">required</span>
                          )}
                          <span className={t.textMuted}>{p.description}</span>
                          <span className={`${t.textMuted} font-mono text-[11px]`}>e.g. {p.example}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {currentDoc.notes && (
                    <p className={`text-xs ${t.textMuted} pl-5 italic`}>{currentDoc.notes}</p>
                  )}
                  {currentDoc.exampleParams && (
                    <button
                      onClick={() => setCustomParams(currentDoc.exampleParams!)}
                      className="ml-5 text-xs text-emerald-500 hover:text-emerald-400 transition-colors font-medium"
                    >
                      Use example params
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Custom Parameters */}
            <div className="space-y-2">
              <label htmlFor="api-params" className={`block text-xs font-medium ${t.textSecondary}`}>
                Query Parameters <span className={t.textMuted}>(optional)</span>
              </label>
              <input
                id="api-params"
                type="text"
                value={customParams}
                onChange={(e) => setCustomParams(e.target.value)}
                placeholder="numbers=12,33,54,57,60&pb=12"
                className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
              />
            </div>

            {/* Run Button */}
            <button
              onClick={() => runTest()}
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
                {/* Request URL */}
                {result.requestUrl && (
                  <div className="space-y-1">
                    <p className={`text-[10px] font-medium ${t.textMuted} uppercase tracking-wider`}>Request</p>
                    <div className={`relative flex items-start gap-2 p-2.5 ${t.codeBg} rounded-md pr-9`}>
                      <span className="text-xs font-semibold text-emerald-500 shrink-0 mt-px">{result.requestMethod}</span>
                      <code className={`text-xs ${t.codeText} font-mono break-all`}>{result.requestUrl}</code>
                      <button
                        onClick={() => copyToClipboard(result.requestUrl!, 'requestUrl')}
                        className={`absolute top-2 right-2 p-1 rounded transition-colors ${
                          copiedId === 'requestUrl' ? 'text-emerald-500' : t.copyButton
                        }`}
                      >
                        {copiedId === 'requestUrl' ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                )}

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

                {/* Error Message + Hint */}
                {result.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md space-y-2">
                    <p className="text-red-500 text-sm">{result.error}</p>
                    {(() => {
                      const hint = getErrorHint(
                        result.endpointKey || '',
                        result.status,
                        result.paramsUsed || ''
                      );
                      return hint ? (
                        <div className="flex items-start gap-2 pt-2 border-t border-red-500/10">
                          <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-amber-500 text-xs">{hint}</p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* Response Data */}
                {result.data && (
                  <div className="relative">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2), 'response')}
                      className={`absolute top-2 right-2 p-1.5 rounded transition-colors ${
                        copiedId === 'response' ? 'text-emerald-500' : copiedId === 'error' ? 'text-red-500' : t.copyButton
                      }`}
                    >
                      {copiedId === 'response' ? <Check size={14} /> : <Copy size={14} />}
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
        <div className="space-y-2">
          {QUICK_TESTS.map((qt) => (
            <div
              key={qt.endpoint + qt.params}
              className={`flex items-center justify-between p-3 ${t.rowBg} rounded-md`}
            >
              <div className="min-w-0">
                <p className={`text-sm font-medium ${t.textPrimary}`}>{qt.label}</p>
                <p className={`text-xs ${t.textMuted} truncate`}>{qt.description}</p>
                {qt.params && (
                  <p className={`text-[11px] ${t.textMuted} font-mono mt-0.5`}>{qt.params}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedEndpoint(qt.endpoint);
                  setCustomParams(qt.params);
                  runTest(qt.endpoint, qt.params);
                }}
                disabled={isLoading}
                className="shrink-0 ml-3 p-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                title={`Run: ${qt.label}`}
              >
                <Play size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiTester;
