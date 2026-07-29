'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormField } from '@/components/common/FormField';
import { useReducedMotion } from '@/lib/motion';

const CLOSE_ANIMATION_MS = 200;

interface GenerateKeyModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface GeneratedKey {
  key: string;
  keyId: string;
}

export function GenerateKeyModal({ onSuccess, onCancel }: GenerateKeyModalProps): React.ReactElement {
  const [open, setOpen] = useState(true);
  const [keyName, setKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorPulse, setErrorPulse] = useState(0);
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null);
  const [copied, setCopied] = useState(false);
  const reducedMotion = useReducedMotion();

  const requestClose = (after: () => void) => {
    setOpen(false);
    setTimeout(after, CLOSE_ANIMATION_MS);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!keyName.trim()) {
      setError('Key name is required');
      setErrorPulse((n) => n + 1);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate key');
      }

      const data = await response.json();
      setGeneratedKey(data);
    } catch (err) {
      const apiError = parseAPIError(err);
      handleAPIError(err);
      setError(apiError.message);
      setErrorPulse((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    requestClose(generatedKey ? onSuccess : onCancel);
  };

  return (
    <Modal open={open} onClose={handleClose} title={generatedKey ? 'API Key Generated' : 'Generate API Key'}>
      <AnimatePresence mode="wait" initial={false}>
        {generatedKey ? (
          <motion.div
            key="result"
            initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
              <p className="text-sm text-blue-300">
                <strong>Save this key now.</strong> You won&apos;t be able to see it again for security reasons.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">Your API Key</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedKey.key}
                  readOnly
                  className="input-field flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="primary"
                  icon={copied ? <Check size={16} /> : <Copy size={16} />}
                  onClick={handleCopyKey}
                  className="flex-shrink-0"
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <FormField label="Key ID" value={generatedKey.keyId} readOnly className="font-mono text-sm" />

            <Button type="button" variant="primary" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleGenerate}
            className="space-y-4"
          >
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <FormField
              label="Key Name"
              name="keyName"
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Production API Key"
              helpText="Give your key a descriptive name for easy identification"
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => requestClose(onCancel)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" loading={loading} errorPulse={errorPulse}>
                Generate
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
