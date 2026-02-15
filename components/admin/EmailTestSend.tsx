import React, { useState, useEffect } from 'react';
import {
  Send,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import { getEmailTemplates, sendEmail } from '../../services/email';
import type { EmailTemplate } from '../../types/database';

interface SendResult {
  success: boolean;
  message_id?: string;
  log_id?: string;
  error?: string;
  responseTime: number;
  renderedHtml?: string;
}

const EmailTestSend: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [toEmail, setToEmail] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customHtml, setCustomHtml] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [result, setResult] = useState<SendResult | null>(null);
  const [useCustom, setUseCustom] = useState(false);

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
    iconMuted: isDark ? 'text-zinc-700' : 'text-zinc-300',
    copyButton: isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200',
    buttonBg: isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200',
    buttonText: isDark ? 'text-zinc-300' : 'text-zinc-700',
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    const { data } = await getEmailTemplates();
    if (data) {
      setTemplates(data.filter((t) => t.is_active));
    }
    setIsLoadingTemplates(false);
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setUseCustom(false);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const vars: Record<string, string> = {};
      template.variables.forEach((v) => {
        vars[v] = '';
      });
      setVariables(vars);
    } else {
      setVariables({});
    }
  };

  const handleSendTest = async () => {
    if (!toEmail) return;
    if (!useCustom && !selectedTemplateId) return;
    if (useCustom && (!customSubject || !customHtml)) return;

    setIsSending(true);
    setResult(null);
    const startTime = performance.now();

    const params: Parameters<typeof sendEmail>[0] = {
      to: toEmail,
      variables,
      triggered_by: 'admin_test',
    };

    if (useCustom) {
      params.subject = customSubject;
      params.html_body = customHtml;
    } else {
      params.template_id = selectedTemplateId;
    }

    const { data, error } = await sendEmail(params);
    const responseTime = Math.round(performance.now() - startTime);

    if (error && !data) {
      setResult({ success: false, error, responseTime });
    } else {
      // Build rendered preview
      let renderedHtml = useCustom ? customHtml : selectedTemplate?.html_body || '';
      renderedHtml = renderedHtml.replace(
        /\{\{(\w+)\}\}/g,
        (_, key) => variables[key] ?? `{{${key}}}`
      );
      setResult({
        success: data?.success ?? false,
        message_id: data?.message_id,
        log_id: data?.log_id,
        error: data?.success ? undefined : (error || data?.error),
        responseTime,
        renderedHtml,
      });
    }
    setIsSending(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isLoadingTemplates) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`w-6 h-6 ${t.textMuted} animate-spin`} />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Request panel */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
        <div className={`px-4 py-3 border-b ${t.cardBorder}`}>
          <h2 className={`text-sm font-medium ${t.textPrimary}`}>Send Test Email</h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Source toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setUseCustom(false)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                !useCustom
                  ? 'bg-emerald-600 text-white'
                  : `${t.buttonBg} ${t.buttonText}`
              }`}
            >
              From Template
            </button>
            <button
              onClick={() => setUseCustom(true)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                useCustom
                  ? 'bg-emerald-600 text-white'
                  : `${t.buttonBg} ${t.buttonText}`
              }`}
            >
              Custom HTML
            </button>
          </div>

          {/* Recipient */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-medium ${t.textSecondary}`}>To</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
            />
          </div>

          {!useCustom ? (
            <>
              {/* Template selector */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-medium ${t.textSecondary}`}>Template</label>
                <div className="relative">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                  >
                    <option value="">Select a template...</option>
                    {templates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} pointer-events-none`}
                  />
                </div>
                {selectedTemplate?.description && (
                  <p className={`text-xs ${t.textMuted}`}>{selectedTemplate.description}</p>
                )}
              </div>

              {/* Dynamic variable inputs */}
              {selectedTemplate && selectedTemplate.variables.length > 0 && (
                <div className="space-y-2">
                  <label className={`block text-xs font-medium ${t.textSecondary}`}>Variables</label>
                  {selectedTemplate.variables.map((varName) => (
                    <div key={varName} className="flex items-center gap-2">
                      <span className={`text-xs font-mono ${t.textMuted} shrink-0 w-24`}>
                        {`{{${varName}}}`}
                      </span>
                      <input
                        type="text"
                        value={variables[varName] || ''}
                        onChange={(e) =>
                          setVariables((prev) => ({ ...prev, [varName]: e.target.value }))
                        }
                        placeholder={`Enter ${varName}...`}
                        className={`flex-1 px-3 py-1.5 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-1 focus:ring-emerald-600`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Custom subject */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-medium ${t.textSecondary}`}>Subject</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Test email subject"
                  className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                />
              </div>

              {/* Custom HTML */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-medium ${t.textSecondary}`}>HTML Body</label>
                <textarea
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  rows={10}
                  placeholder="<html>...</html>"
                  className={`w-full px-3 py-2 ${t.codeBg} border ${t.inputBorder} rounded-md ${t.codeText} text-xs font-mono ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y`}
                />
              </div>
            </>
          )}

          {/* Send button */}
          <button
            onClick={handleSendTest}
            disabled={isSending || !toEmail || (!useCustom && !selectedTemplateId) || (useCustom && (!customSubject || !customHtml))}
            className={`w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 ${
              isDark ? 'disabled:bg-zinc-700 disabled:text-zinc-500' : 'disabled:bg-zinc-300 disabled:text-zinc-500'
            } text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2`}
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Test Email
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result panel */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
        <div className={`px-4 py-3 border-b ${t.cardBorder} flex items-center justify-between`}>
          <h2 className={`text-sm font-medium ${t.textPrimary}`}>Result</h2>
          {result && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <Clock size={12} className={t.textMuted} />
                <span className={t.textSecondary}>{result.responseTime}ms</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  result.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}
              >
                {result.success ? 'Sent' : 'Failed'}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Mail size={24} className={t.iconMuted} />
              <p className={`${t.textMuted} text-sm mt-2`}>Send a test to see the result</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <XCircle size={16} className="text-red-500" />
                )}
                <span className={`text-sm font-medium ${result.success ? 'text-emerald-500' : 'text-red-500'}`}>
                  {result.success ? 'Email sent successfully' : 'Send failed'}
                </span>
              </div>

              {/* Error */}
              {result.error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-500 text-sm">{result.error}</p>
                </div>
              )}

              {/* Details */}
              {result.message_id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${t.textMuted}`}>Resend Message ID</span>
                    <div className="flex items-center gap-1.5">
                      <code className={`text-xs font-mono ${t.codeText}`}>{result.message_id}</code>
                      <button
                        onClick={() => copyToClipboard(result.message_id!)}
                        className={`p-1 ${t.copyButton} rounded transition-colors`}
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                  {result.log_id && (
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${t.textMuted}`}>Log ID</span>
                      <code className={`text-xs font-mono ${t.codeText}`}>{result.log_id}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Rendered preview */}
              {result.renderedHtml && (
                <div className="space-y-2">
                  <p className={`text-xs font-medium ${t.textSecondary}`}>Rendered Preview</p>
                  <div className={`border ${t.cardBorder} rounded-md overflow-hidden`}>
                    <iframe
                      srcDoc={result.renderedHtml}
                      sandbox=""
                      className="w-full bg-white"
                      style={{ height: '300px' }}
                      title="Sent email preview"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTestSend;
