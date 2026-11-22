import React, { useState } from 'react';
import { getAppConfig, saveAppConfig } from '../../services/config';
import { X, Save, Key, Database, FileSpreadsheet } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getAppConfig();
  const [googleSheetId, setGoogleSheetId] = useState(currentConfig.googleSheetId || '');
  const [adminPasscode, setAdminPasscode] = useState(currentConfig.adminPasscode || 'auction2026');
  const [firebaseJson, setFirebaseJson] = useState(
    currentConfig.firebaseConfig ? JSON.stringify(currentConfig.firebaseConfig, null, 2) : ''
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      setError(null);
      let parsedFirebase = undefined;
      if (firebaseJson.trim()) {
        try {
          parsedFirebase = JSON.parse(firebaseJson);
        } catch {
          throw new Error('Invalid Firebase JSON format');
        }
      }

      saveAppConfig({
        googleSheetId: googleSheetId.trim(),
        adminPasscode: adminPasscode.trim(),
        firebaseConfig: parsedFirebase,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
        window.location.reload(); // Reload to reinit Firebase
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save configuration');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-left max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Settings & Integrations
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">
            Settings saved successfully! Refreshing...
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Admin Passcode */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
              <Key className="w-4 h-4 text-amber-400" />
              Admin Passcode
            </label>
            <input
              type="text"
              value={adminPasscode}
              onChange={(e) => setAdminPasscode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="e.g. auction2026"
            />
            <p className="text-[11px] text-slate-500 mt-1">Passcode required to open /auction/admin</p>
          </div>

          {/* Google Sheet ID */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Google Sheet ID
            </label>
            <input
              type="text"
              value={googleSheetId}
              onChange={(e) => setGoogleSheetId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              From your Google Sheet URL. Leave empty to use built-in tournament mock data.
            </p>
          </div>

          {/* Firebase Realtime Database JSON */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
              <Database className="w-4 h-4 text-blue-400" />
              Firebase Config JSON (Optional for Realtime Sync)
            </label>
            <textarea
              rows={6}
              value={firebaseJson}
              onChange={(e) => setFirebaseJson(e.target.value)}
              className="w-full font-mono bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder={`{\n  "apiKey": "...",\n  "databaseURL": "https://...firebasedatabase.app",\n  "projectId": "..."\n}`}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Paste the `firebaseConfig` object from Firebase Console. If empty, sync operates locally between browser tabs.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow transition-all"
          >
            <Save className="w-4 h-4" />
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
