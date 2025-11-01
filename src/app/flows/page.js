'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Toast from '@/components/ui/Toast';
import { getAllFlows, deleteFlow, loadSampleFlows } from '@/lib/workflowStorage';
import { sampleFlows } from '@/lib/sampleFlows';
import { Plus, Search, Pencil, Trash2, Play, Workflow, Download } from 'lucide-react';

const PAGE_SIZE = 6;

const formatDate = (timestamp) => {
  if (!timestamp) {
    return '—';
  }
  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return '—';
  }
};

export default function FlowsPage() {
  const [flows, setFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadFlows = async () => {
      try {
        const data = await getAllFlows();
        if (isMounted) {
          setFlows(data);
        }
      } catch (error) {
        if (isMounted) {
          setToast({ message: error?.message || 'Failed to load flows.', type: 'error' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFlows();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFlows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return flows;
    }
    return flows.filter((flow) => {
      const name = flow.name?.toLowerCase() || '';
      const description = flow.description?.toLowerCase() || '';
      return name.includes(term) || description.includes(term);
    });
  }, [flows, searchTerm]);

  const filteredLength = filteredFlows.length;
  const totalPages = Math.max(1, Math.ceil(filteredLength / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedFlows = filteredFlows.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filteredLength === 0 ? 0 : startIndex + 1;
  const showingTo = startIndex + paginatedFlows.length;

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this flow? This action cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      await deleteFlow(id);
      setFlows((current) => current.filter((item) => item.id !== id));
      setToast({ message: 'Flow deleted.', type: 'success' });
    } catch (error) {
      setToast({ message: error?.message || 'Failed to delete flow.', type: 'error' });
    }
  };

  const handleLoadSamples = async () => {
    const confirmed = window.confirm('Load 3 sample flows? These will be added to your library.');
    if (!confirmed) {
      return;
    }
    try {
      setIsLoading(true);
      const loaded = await loadSampleFlows(sampleFlows);
      setFlows((current) => [...current, ...loaded]);
      setToast({ message: `${loaded.length} sample flows loaded successfully!`, type: 'success' });
    } catch (error) {
      setToast({ message: error?.message || 'Failed to load sample flows.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToastClose = () => {
    setToast(null);
  };

  return (
    <MainLayout>
      <div className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <Card gradient className="shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div 
                className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #14b8a6 0%, #06b6d4 50%, #0ea5e9 100%)',
                }}
              >
                <Workflow className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-1">Flow Library</h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Manage every Flow locally without leaving the browser. Organize, edit, and execute workflows with the same polished experience as the playground tools.
                </p>
              </div>
              <div className="hidden sm:flex gap-2">
                <Button 
                  onClick={handleLoadSamples} 
                  variant="secondary" 
                  icon={Download} 
                  className="whitespace-nowrap"
                  disabled={isLoading}
                >
                  Load Samples
                </Button>
                <Link href="/flows/new">
                  <Button icon={Plus} className="whitespace-nowrap">New Flow</Button>
                </Link>
              </div>
            </div>
            <div className="sm:hidden flex flex-col gap-2">
              <Button 
                onClick={handleLoadSamples} 
                variant="secondary" 
                icon={Download} 
                className="w-full justify-center"
                disabled={isLoading}
              >
                Load Sample Flows
              </Button>
              <Link href="/flows/new" className="w-full">
                <Button icon={Plus} className="w-full justify-center">New Flow</Button>
              </Link>
            </div>
          </Card>

          <Card className="shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search flows"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-2xl font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-400/20 transition-all bg-white"
                />
              </div>
              <div className="text-sm font-medium text-slate-500">
                {filteredLength} {filteredLength === 1 ? 'flow found' : 'flows found'}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              {isLoading ? (
                <div className="py-16 text-center text-slate-500 font-semibold">Loading flows...</div>
              ) : paginatedFlows.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-slate-500 font-semibold">No flows yet.</p>
                  <p className="text-slate-400 text-sm mt-2">Create your first Flow to see it listed here.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-4">Name</th>
                      <th className="pb-4">Description</th>
                      <th className="pb-4">Last Updated</th>
                      <th className="pb-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFlows.map((flow) => (
                      <tr key={flow.id} className="border-t border-slate-100">
                        <td className="py-4 pr-4 align-center">
                          <div className="font-semibold text-slate-900">{flow.name || 'Untitled flow'}</div>
                        </td>
                        <td className="py-4 pr-4 align-center text-sm text-slate-500">
                          {flow.description ? (
                            <span className="leading-relaxed block max-w-xl wrap-break-word">{flow.description}</span>
                          ) : (
                            <span className="italic text-slate-400">No description provided.</span>
                          )}
                        </td>
                        <td className="py-4 pr-4 align-center text-sm text-slate-500">{formatDate(flow.updatedAt)}</td>
                        <td className="py-4 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Link
                              href={`/flows/${flow.id}/run`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-teal-200 text-sm font-semibold text-teal-600 hover:bg-teal-50 transition-colors whitespace-nowrap"
                            >
                              <Play className="w-4 h-4" />
                              Bulk run
                            </Link>
                            <Link
                              href={`/flows/${flow.id}/edit`}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:border-teal-400 hover:text-teal-600 transition-colors whitespace-nowrap"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(flow.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors whitespace-nowrap"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-slate-500 font-medium">
                Showing {showingFrom}–{showingTo} of {filteredLength} {filteredLength === 1 ? 'flow' : 'flows'}
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || isLoading}
                  className="px-3 sm:px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="px-3 sm:px-4 py-2 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Next
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {toast && (
        <div className="fixed top-6 right-6">
          <Toast message={toast.message} type={toast.type} onClose={handleToastClose} />
        </div>
      )}
    </MainLayout>
  );
}
