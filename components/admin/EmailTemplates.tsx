import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  AlertTriangle,
} from 'lucide-react';
import { useAdminTheme, getAdminTheme } from '../../hooks/useAdminTheme';
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from '../../services/email';
import type { EmailTemplate } from '../../types/database';
import FocusTrap from '../FocusTrap';

interface CleanState {
  name: string;
  subject: string;
  description: string;
  variables: string;
  htmlBody: string;
  isActive: boolean;
}

interface EmailTemplatesProps {
  onDirtyChange?: (isDirty: boolean) => void;
  pendingNavigation?: (() => void) | null;
  onNavigationHandled?: () => void;
}

const EmailTemplates: React.FC<EmailTemplatesProps> = ({
  onDirtyChange,
  pendingNavigation,
  onNavigationHandled,
}) => {
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

  // Unsaved changes tracking
  const cleanStateRef = useRef<CleanState | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const t = getAdminTheme(isDark);

  // Compute dirty state
  const isDirty = (() => {
    const clean = cleanStateRef.current;
    if (!clean) return false;
    return (
      editName !== clean.name ||
      editSubject !== clean.subject ||
      editDescription !== clean.description ||
      editVariables !== clean.variables ||
      editHtmlBody !== clean.htmlBody ||
      editIsActive !== clean.isActive
    );
  })();

  // Report dirty state to parent
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Warn on browser navigation/refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Handle pending navigation from parent (e.g. tab switch)
  useEffect(() => {
    if (!pendingNavigation) return;
    if (isDirty) {
      setPendingAction(() => pendingNavigation);
      setShowUnsavedDialog(true);
    } else {
      pendingNavigation();
      onNavigationHandled?.();
    }
    // Only react to pendingNavigation changes; isDirty is read at trigger time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNavigation]);

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

  const updateCleanState = () => {
    cleanStateRef.current = {
      name: editName,
      subject: editSubject,
      description: editDescription,
      variables: editVariables,
      htmlBody: editHtmlBody,
      isActive: editIsActive,
    };
  };

  // Load a template into the editor without guarding (used after save, initial select)
  const loadTemplate = (template: EmailTemplate) => {
    setSelectedId(template.id);
    setIsCreating(false);
    setEditName(template.name);
    setEditSubject(template.subject);
    setEditDescription(template.description || '');
    setEditVariables(template.variables.join(', '));
    setEditHtmlBody(template.html_body);
    setEditIsActive(template.is_active);
    setError(null);
    cleanStateRef.current = {
      name: template.name,
      subject: template.subject,
      description: template.description || '',
      variables: template.variables.join(', '),
      htmlBody: template.html_body,
      isActive: template.is_active,
    };
    const vars: Record<string, string> = {};
    template.variables.forEach((v) => {
      vars[v] = `Sample ${v}`;
    });
    setSampleVars(vars);
  };

  // If there are unsaved changes, show the dialog; otherwise run the action immediately
  const guardNavigation = (action: () => void) => {
    if (!isDirty) {
      action();
      return;
    }
    setPendingAction(() => action);
    setShowUnsavedDialog(true);
  };

  // Dialog handlers
  const handleDialogSave = async () => {
    const success = await handleSave();
    setShowUnsavedDialog(false);
    if (success) {
      pendingAction?.();
    }
    setPendingAction(null);
    onNavigationHandled?.();
  };

  const handleDialogDiscard = () => {
    setShowUnsavedDialog(false);
    pendingAction?.();
    setPendingAction(null);
    onNavigationHandled?.();
  };

  const handleDialogCancel = () => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
    onNavigationHandled?.();
  };

  const selectTemplate = (template: EmailTemplate) => {
    if (selectedId === template.id) return;
    guardNavigation(() => loadTemplate(template));
  };

  const startCreate = () => {
    guardNavigation(() => {
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
      cleanStateRef.current = {
        name: '',
        subject: '',
        description: '',
        variables: '',
        htmlBody: '',
        isActive: true,
      };
    });
  };

  const cancelEdit = () => {
    guardNavigation(() => {
      setSelectedId(null);
      setIsCreating(false);
      setError(null);
      cleanStateRef.current = null;
    });
  };

  const parseVariables = (input: string): string[] => {
    return input
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const handleSave = async (): Promise<boolean> => {
    if (!editName || !editSubject || !editHtmlBody) {
      setError('Name, subject, and HTML body are required');
      return false;
    }
    setIsSaving(true);
    setError(null);
    const variables = parseVariables(editVariables);

    let success = false;

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
        loadTemplate(data);
        success = true;
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
        updateCleanState();
        success = true;
      }
    }
    setIsSaving(false);
    return success;
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
        cleanStateRef.current = null;
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
    <>
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
                      {selectedId === template.id && isDirty && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 shrink-0">
                          Edited
                        </span>
                      )}
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
                  <div className="flex items-center gap-2">
                    <h2 className={`text-sm font-medium ${t.textPrimary}`}>
                      {isCreating ? 'New Template' : 'Edit Template'}
                    </h2>
                    {isDirty && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">
                        Edited
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEdit}
                      className={`p-1.5 ${t.buttonBg} ${t.buttonText} rounded-md text-xs transition-colors`}
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={() => handleSave()}
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
                      <label htmlFor="tmpl-name" className={`block text-xs font-medium ${t.textSecondary}`}>Name (slug)</label>
                      <input
                        id="tmpl-name"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="contact_auto_reply"
                        className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="tmpl-description" className={`block text-xs font-medium ${t.textSecondary}`}>Description</label>
                      <input
                        id="tmpl-description"
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="What this template is for..."
                        className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="tmpl-subject" className={`block text-xs font-medium ${t.textSecondary}`}>
                      Subject <span className={t.textMuted}>(supports {'{{variables}}'} )</span>
                    </label>
                    <input
                      id="tmpl-subject"
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Thanks for reaching out, {{name}}!"
                      className={`w-full px-3 py-2 ${t.inputBg} border ${t.inputBorder} rounded-md ${t.inputText} text-sm ${t.placeholder} focus:outline-none focus:ring-2 focus:ring-emerald-600`}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="tmpl-variables" className={`block text-xs font-medium ${t.textSecondary}`}>
                        Variables <span className={t.textMuted}>(comma-separated)</span>
                      </label>
                      <input
                        id="tmpl-variables"
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
                    <label htmlFor="tmpl-html-body" className={`block text-xs font-medium ${t.textSecondary}`}>HTML Body</label>
                    <textarea
                      id="tmpl-html-body"
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

      {/* Unsaved changes confirmation dialog */}
      {showUnsavedDialog && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${t.overlay} backdrop-blur-sm`}>
          <FocusTrap onClose={handleDialogCancel}>
            <div className={`${t.cardBg} border ${t.cardBorder} rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${t.textPrimary}`}>Unsaved Changes</h3>
                  <p className={`text-xs ${t.textMuted} mt-0.5`}>You have unsaved changes that will be lost.</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleDialogCancel}
                  className={`px-3 py-1.5 text-xs ${t.buttonBg} ${t.buttonText} rounded-md transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDialogDiscard}
                  className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleDialogSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md transition-colors"
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save & Continue
                </button>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
};

export default EmailTemplates;
