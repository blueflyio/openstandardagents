'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Agent } from '@/types/agent';
import * as yaml from 'js-yaml';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface RegistrationState {
  step: 'upload' | 'preview' | 'submit' | 'success';
  manifest: any;
  validationErrors: string[];
  gaid?: string;
  agent?: Agent;
}

export function AgentRegistrationForm() {
  const [state, setState] = useState<RegistrationState>({
    step: 'upload',
    manifest: null,
    validationErrors: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      const manifest = yaml.load(content);

      // Validate manifest
      const validation = await api.validateManifest(manifest);

      if (validation.valid) {
        setState({
          step: 'preview',
          manifest,
          validationErrors: [],
        });
      } else {
        setState({
          step: 'upload',
          manifest: null,
          validationErrors: validation.errors || [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse manifest file');
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = async (content: string) => {
    setLoading(true);
    setError(null);

    try {
      const manifest = yaml.load(content);

      // Validate manifest
      const validation = await api.validateManifest(manifest);

      if (validation.valid) {
        setState({
          step: 'preview',
          manifest,
          validationErrors: [],
        });
      } else {
        setState({
          step: 'upload',
          manifest: null,
          validationErrors: validation.errors || [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse manifest');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.registerAgent(state.manifest);

      setState({
        ...state,
        step: 'success',
        gaid: result.gaid,
        agent: result.agent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register agent');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setState({
      step: 'upload',
      manifest: null,
      validationErrors: [],
    });
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['Upload', 'Preview', 'Submit', 'Success'].map((label, index) => {
            const stepIndex = ['upload', 'preview', 'submit', 'success'].indexOf(state.step);
            const isActive = index === stepIndex;
            const isCompleted = index < stepIndex;

            return (
              <div key={label} className="flex items-center">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium',
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : index + 1}
                </div>
                <span
                  className={clsx(
                    'ml-2 text-sm font-medium',
                    isActive ? 'text-primary-600' : 'text-gray-600'
                  )}
                >
                  {label}
                </span>
                {index < 3 && <div className="w-24 h-0.5 bg-gray-300 mx-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {state.validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 font-medium mb-2">Validation Errors</p>
          <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
            {state.validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Step */}
      {state.step === 'upload' && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload OSSA Manifest</h2>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
            <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 mb-2">
              Drag and drop your OSSA manifest file, or click to browse
            </p>
            <p className="text-gray-500 text-sm mb-4">Supports .yaml, .yml files</p>
            <label className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              Choose File
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>

          {/* Manual Input */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Or paste your manifest</h3>
            <textarea
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Paste your OSSA manifest YAML here..."
              disabled={loading}
              onBlur={(e) => e.target.value && handleManualInput(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Preview Step */}
      {state.step === 'preview' && state.manifest && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview Agent ID Card</h2>

          {/* Agent ID Card Preview */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-8 text-white mb-6">
            <h3 className="text-3xl font-bold mb-2">{state.manifest.name}</h3>
            <p className="text-lg text-white/90 mb-4">{state.manifest.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/70">Version:</span>
                <span className="ml-2 font-medium">{state.manifest.version}</span>
              </div>
              <div>
                <span className="text-white/70">Author:</span>
                <span className="ml-2 font-medium">{state.manifest.author?.name || 'Unknown'}</span>
              </div>
              {state.manifest.capabilities && (
                <div className="col-span-2">
                  <span className="text-white/70">Capabilities:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {state.manifest.capabilities.map((cap: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-white/20 rounded text-xs">
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Manifest Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Manifest Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm overflow-auto">{yaml.dump(state.manifest)}</pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={reset}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={() => setState({ ...state, step: 'submit' })}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              Continue to Submit
            </button>
          </div>
        </div>
      )}

      {/* Submit Step */}
      {state.step === 'submit' && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Registration</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-blue-900 font-medium mb-2">Before you submit:</h3>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>Verify all information in your manifest is accurate</li>
              <li>Ensure your agent follows OSSA best practices</li>
              <li>Read and accept the marketplace terms of service</li>
              <li>A unique GAID (Global Agent ID) will be generated for your agent</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="flex items-start cursor-pointer">
              <input type="checkbox" className="mt-1 h-4 w-4 text-primary-600 rounded" required />
              <span className="ml-3 text-gray-700">
                I confirm that this agent manifest is accurate and I accept the{' '}
                <a href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                  marketplace terms of service
                </a>
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setState({ ...state, step: 'preview' })}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </div>
      )}

      {/* Success Step */}
      {state.step === 'success' && state.agent && state.gaid && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your agent has been successfully registered to the marketplace
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Your Agent&apos;s GAID:</p>
            <code className="text-lg font-mono text-primary-600">{state.gaid}</code>
          </div>

          <div className="flex items-center justify-center gap-4">
            <a
              href={`/agents/${state.gaid}`}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              View Agent Page
            </a>
            <button
              onClick={reset}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Register Another Agent
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
