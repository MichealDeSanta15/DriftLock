'use client';

import React, { useState, useEffect } from 'react';
import { getSites, type Site } from '@/lib/api';
import { parseAPIError, handleAPIError } from '@/lib/errorHandler';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { AddSiteModal } from './Modals/AddSiteModal';
import { EditSiteModal } from './Modals/EditSiteModal';
import { ConfirmDeleteModal } from './Modals/ConfirmDeleteModal';

export function SiteManagement(): React.ReactElement {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSites = await getSites();
      setSites(fetchedSites);
    } catch (err) {
      const apiError = parseAPIError(err);
      handleAPIError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = () => {
    setShowAddModal(true);
  };

  const handleEditSite = (site: Site) => {
    setEditingSite(site);
    setShowEditModal(true);
  };

  const handleDeleteSite = (site: Site) => {
    setDeletingSite(site);
    setShowDeleteModal(true);
  };

  const handleAddSiteSuccess = (newSite: Site) => {
    setSites([...sites, newSite]);
    setShowAddModal(false);
    setSuccessMessage('Site added successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleEditSiteSuccess = (updatedSite: Site) => {
    setSites(sites.map((site) => (site.id === updatedSite.id ? updatedSite : site)));
    setShowEditModal(false);
    setEditingSite(null);
    setSuccessMessage('Site updated successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteSiteSuccess = () => {
    if (deletingSite) {
      setSites(sites.filter((site) => site.id !== deletingSite.id));
      setShowDeleteModal(false);
      setDeletingSite(null);
      setSuccessMessage('Site deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monitored Sites</h3>
        <button
          onClick={handleAddSite}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
        >
          + Add Site
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4">
          <p className="text-sm text-green-800 dark:text-green-300">✅ {successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 flex items-center justify-between">
          <p className="text-sm text-red-800 dark:text-red-300">❌ {error}</p>
          <button
            onClick={fetchSites}
            className="ml-4 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/40 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition"
            aria-label="Retry loading sites"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader type="table-row" count={3} />
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No sites added yet</p>
          <button
            onClick={handleAddSite}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Add your first site
          </button>
        </div>
      ) : (
        /* Sites Table */
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Site Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">URL</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Selectors</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sites.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{site.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 truncate max-w-xs">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {site.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        1 selector
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          site.status === 'working'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : site.status === 'broken'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {site.status === 'working' ? '✅' : site.status === 'broken' ? '⚠️' : '❌'} {site.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleEditSite(site)}
                        className="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSite(site)}
                        className="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddSiteModal
          onSuccess={handleAddSiteSuccess}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showEditModal && editingSite && (
        <EditSiteModal
          site={editingSite}
          onSuccess={handleEditSiteSuccess}
          onCancel={() => {
            setShowEditModal(false);
            setEditingSite(null);
          }}
        />
      )}

      {showDeleteModal && deletingSite && (
        <ConfirmDeleteModal
          siteName={deletingSite.name}
          onConfirm={handleDeleteSiteSuccess}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeletingSite(null);
          }}
          siteId={deletingSite.id}
        />
      )}
    </div>
  );
}
