import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  X,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../../services/email';
import type { EmailTemplate } from '../../types/database';

const EmailTemplates: React.FC = () => {
  const { isDark } = useAdminTheme();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Editor state
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVariables, setEditVariables] = useState('');
  const [editHtmlBody, setEditHtmlBody] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  // Sample variable values for preview
  const [sampleVars, setSampleVars] = useState<Record<string, string>>({});

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
    rowHover: isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50',
    rowActive: isDark ? 'bg-zinc-800' : 'bg-zinc-100',
    buttonBg: isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200',
    buttonText: isDark ? 'text-zinc-300' : 'text-zinc-700',
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await getEmailTemplates();
    if (data) setTemplates(data);
    if (error) setError(error);
    setIsLoading(false);
  };

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedId(template.id);
    setIsCreating(false);
    setEditName(template.name);
    setEditSubject(template.subject);
    setEditDescription(template.description || '');
    setEditVariables(template.variables.join(', '));
    setEditHtmlBody(template.html_body);
    setEditIsActive(template.is_active);
    setError(null);
    // Initialize sample vars
    const vars: Record<string, string> = {};
    template.variables.forEach((v) => {
      vars[v] = `Sample ${v}`;
    });
    setSampleVars(vars);
  };

  const startCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
    setEditName('');
    setEditSubject('');
    setEditDescription('');
    setEditVariables('');
    setEditHtmlBody('');
    setEditIsActive(true);
    setSampleVars({});
    setError(null);
  };

  const cancelEdit = () => {
    setSelectedId(null);
    setIsCreating(false);
    setError(null);
  };

  const parseVariables = (input: string): string[] => {
    return input
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const handleSave = async () => {
    if (!editName || !editSubject || !editHtmlBody) {
      setError('Name, subject, and HTML body are required');
      return;
    }
    setIsSaving(true);
    setError(null);
    const variables = parseVariables(editVariables);

    if (isCreating) {
      const { data, error } = await createEmailTemplate({
        name: editName,
        subject: editSubject,
        html_body: editHtmlBody,
        variables,
        description: editDescription || undefined,
      });
      if (error) {
        setError(error);
      } else if (data) {
        setTemplates((prev) => [data, ...prev]);
        selectTemplate(data);
      }
    } else if (selectedId) {
      const { data, error } = await updateEmailTemplate(selectedId, {
        name: editName,
        subject: editSubject,
        html_body: editHtmlBody,
        variables,
        description: editDescription || undefined,
        is_active: editIsActive,
      });
      if (error) {
        setError(error);
      } else if (data) {
        setTemplates((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    const { error } = await deleteEmailTemplate(id);
    if (error) {
      setError(error);
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setIsCreating(false);
      }
    }
  };

  // Build preview HTML with interpolated variables
  const getPreviewHtml = (): string => {
    let html = editHtmlBody;
    html = html.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleVars[key] ?? `{{${key}}}`);
    return html;
  };

  // Update sample vars when variables field changes
  const handleVariablesChange = (value: string) => {
    setEditVariables(value);
    const vars = parseVariables(value);
    const newSampleVars: Record<string, string> = {};
    vars.forEach((v) => {
      newSampleVars[v] = sampleVars[v] || `Sample ${v}`;
    });
    setSampleVars(newSampleVars);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className={`w-6 h-6 ${t.textMuted} animate-spin`} />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Template list */}
      <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
        <div className={`px-4 py-3 border-b ${t.cardBorder} flex items-center justify-between`}>
          <h2 className={`text-sm font-medium ${t.textPrimary}`}>Templates</h2>
          <button
            onClick={startCreate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-md transition-colors"
          >
            <Plus size={14} />
            New
          </button>
        </div>
        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
          {templates.length === 0 ? (
            <p className={`${t.textMuted} text-sm text-center py-8`}>No templates yet</p>
          ) : (
            templates.map((template) => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template)}
                className={`w-full text-left px-4 py-3 border-b ${t.cardBorder} transition-colors ${
                  selectedId === template.id ? t.rowActive : t.rowHover
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className={t.textMuted} />
                    <span className={`text-sm font-medium ${t.textPrimary} truncate`}>{template.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        template.is_active
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-zinc-500/10 text-zinc-500'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(template.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {template.description && (
                  <p className={`${t.textMuted} text-xs mt-1 truncate`}>{template.description}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Editor + Preview */}
      <div className="lg:col-span-2 space-y-6">
        {!selectedId && !isCreating ? (
          <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-8 text-center`}>
            <FileText size={24} className={`${t.textMuted} mx-auto mb-2`} />
            <p className={`${t.textMuted} text-sm`}>Select a template to edit or create a new one</p>
          </div>
        ) : (
          <>
            {/* Editor */}
            <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
              <div className={`px-4 py-3 border-b ${t.cardBorder} flex items-center justify-between`}>
                <h2 className={`text-sm font-medium ${t.textPrimary}`}>
                  {isCreating ? 'New Template' : 'Edit Template'}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEdit}
                    className={`p-1.5 ${t.buttonBg} ${t.buttonText} rounded-md text-xs transition-colors`}
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs rounded-md transition-colors"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`block text-xs font-medium ${t.textSecondary}`}>Name (slug)</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="contact_auto_reply"
                      className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`block text-xs font-medium ${t.textSecondary}`}>Description</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="What this template is for..."
                      className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-xs font-medium ${t.textSecondary}`}>
                    Subject <span className={t.textMuted}>(supports {'{{variables}}'} )</span>
                  </label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="Thanks for reaching out, {{name}}!"
                    className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`block text-xs font-medium ${t.textSecondary}`}>
                      Variables <span className={t.textMuted}>(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={editVariables}
                      onChange={(e) => handleVariablesChange(e.target.value)}
                      placeholder="name, email, subject, message"
                      className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono`}
                    />
                  </div>
                  <div className="space-y-1.5 flex items-end">
                    <button
                      onClick={() => setEditIsActive(!editIsActive)}
                      className={`flex items-center gap-2 px-3 py-2 ${t.buttonBg} rounded-md transition-colors`}
                    >
                      {editIsActive ? (
                        <ToggleRight size={18} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={18} className={t.textMuted} />
                      )}
                      <span className={`text-sm ${t.textSecondary}`}>
                        {editIsActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-xs font-medium ${t.textSecondary}`}>HTML Body</label>
                  <textarea
                    value={editHtmlBody}
                    onChange={(e) => setEditHtmlBody(e.target.value)}
                    rows={16}
                    placeholder="<html>...</html>"
                    className={`w-full px-3 py-2 ${t.codeBg} border ${t.inputBorder} rounded-md ${t.codeText} text-xs font-mono ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-y`}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg`}>
              <div className={`px-4 py-3 border-b ${t.cardBorder} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Eye size={14} className={t.textMuted} />
                  <h2 className={`text-sm font-medium ${t.textPrimary}`}>Preview</h2>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`text-xs ${t.buttonBg} ${t.buttonText} px-2.5 py-1 rounded-md transition-colors`}
                >
                  {showPreview ? 'Hide' : 'Show'}
                </button>
              </div>

              {showPreview && (
                <div className="p-4 space-y-3">
                  {/* Sample variable inputs */}
                  {Object.keys(sampleVars).length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-xs font-medium ${t.textSecondary}`}>Sample variables</p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(sampleVars).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className={`text-xs font-mono ${t.textMuted} shrink-0`}>
                              {`{{${key}}}`}
                            </span>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) =>
                                setSampleVars((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              className={`flex-1 px-2 py-1 ${t.inputBg} border ${t.inputBorder} rounded text-xs ${t.inputText} focus:outline-none focus:ring-1 focus:ring-emerald-600`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Subject preview */}
                  <div className="space-y-1">
                    <p className={`text-xs ${t.textMuted}`}>Subject</p>
                    <p className={`text-sm ${t.textPrimary}`}>
                      {editSubject.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleVars[key] ?? `{{${key}}}`)}
                    </p>
                  </div>

                  {/* HTML preview iframe */}
                  <div className={`border ${t.cardBorder} rounded-md overflow-hidden`}>
                    <iframe
                      srcDoc={getPreviewHtml()}
                      sandbox=""
                      className="w-full bg-white"
                      style={{ height: '400px' }}
                      title="Email preview"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailTemplates;
