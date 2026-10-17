/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Smartphone, Download, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#18191E] border border-white/15 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-lg font-bold">Install & Run on Samsung S26</h3>
              <p className="text-xs text-gray-400">Run as native standalone app or export to APK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method 1: Instant PWA Install (Recommended) */}
        <div className="bg-white/5 p-4 rounded-2xl border border-green-500/30 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Method 1: Instant Native App (No APK Build Required)</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            This app is pre-configured with a Web App Manifest and offline service worker. On Samsung Internet or Chrome on your Galaxy S26:
          </p>
          <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside bg-black/30 p-3 rounded-xl border border-white/5">
            <li>Tap the browser menu <strong className="text-white">(⋮ or ☰)</strong>.</li>
            <li>Tap <strong className="text-green-300">Add to Home screen</strong> or <strong className="text-green-300">Install App</strong>.</li>
            <li>The app launches with its own icon, full screen (no address bar), vibration haptics, and complete offline support.</li>
          </ol>
        </div>

        {/* Method 2: Convert to Standalone APK */}
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
            <Download className="w-4 h-4" />
            <span>Method 2: Export as Signed Android APK</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">
            If you want a physical <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300">.apk</code> file to sideload via Android Package Installer on your S26:
          </p>
          <ul className="text-xs text-gray-300 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-400">A.</span>
              <span>
                <strong>PWABuilder (Easiest):</strong> Go to{' '}
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline inline-flex items-center gap-0.5"
                >
                  pwabuilder.com <ExternalLink className="w-3 h-3" />
                </a>
                , enter this app’s URL, and click <strong>Package for Android</strong> to download the ready-to-install APK.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-400">B.</span>
              <span>
                <strong>Bubblewrap CLI / Android Studio:</strong> Run Google’s official Bubblewrap tool (<code>npm i -g @bubblewrap/cli</code>) with <code>bubblewrap init --manifest=...</code> to generate an APK project.
              </span>
            </li>
          </ul>
        </div>

        {/* Ad-Free & Privacy Guarantee */}
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/[0.03] p-3 rounded-xl border border-white/5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>100% ad-free, zero trackers, 100% local persistent storage on your device.</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-98 font-bold text-sm transition"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
