'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import FlowBuilder from '@/components/WorkflowBuilder';
import Toast from '@/components/ui/Toast';
import { getFlow, updateFlow } from '@/lib/workflowStorage';

export default function EditFlowPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = Number(params?.id);
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const [initialWorkflow, setInitialWorkflow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!Number.isFinite(flowId)) {
      setToast({ message: 'Invalid flow identifier.', type: 'error' });
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadFlow = async () => {
      try {
        const flow = await getFlow(flowId);
        if (!flow) {
          if (isMounted) {
            setToast({ message: 'Flow not found.', type: 'error' });
          }
          return;
        }
        if (isMounted) {
          setMetadata({ name: flow.name || '', description: flow.description || '' });
          setInitialWorkflow({ nodes: flow.nodes || [], edges: flow.edges || [] });
        }
      } catch (error) {
        if (isMounted) {
          setToast({ message: error?.message || 'Failed to load flow.', type: 'error' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFlow();
    return () => {
      isMounted = false;
    };
  }, [flowId]);

  const handleMetadataChange = (field, value) => {
    setMetadata((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async ({ nodes, edges }) => {
    const trimmedName = metadata.name.trim();
    if (!trimmedName) {
      throw new Error('Please provide a flow name before saving.');
    }
    setIsSaving(true);
    try {
      await updateFlow(flowId, {
        name: trimmedName,
        description: metadata.description,
        nodes,
        edges
      });
      setIsSaving(false);
    } catch (error) {
      setIsSaving(false);
      throw error;
    }
  };

  const handleOpenBulkRunner = useCallback(() => {
    if (!Number.isFinite(flowId)) {
      return;
    }
    router.push(`/flows/${flowId}/run`);
  }, [flowId, router]);

  const handleToastClose = () => {
    setToast(null);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-500 font-semibold">Loading flow...</div>
        </div>
      </MainLayout>
    );
  }

  if (!initialWorkflow) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 text-center px-6">
          <div className="text-slate-500 font-semibold">We could not find that flow.</div>
          <button
            type="button"
            onClick={() => router.push('/flows')}
            className="px-6 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Back to flows
          </button>
        </div>
        {toast && (
          <div className="fixed top-6 right-6">
            <Toast message={toast.message} type={toast.type} onClose={handleToastClose} />
          </div>
        )}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <FlowBuilder
        key={`flow-${flowId}`}
        initialWorkflow={initialWorkflow}
        metadata={metadata}
        onMetadataChange={handleMetadataChange}
        onSave={handleSave}
        isSaving={isSaving}
        saveButtonLabel="Save Changes"
        onRunBulk={handleOpenBulkRunner}
      />
      {toast && (
        <div className="fixed top-6 right-6">
          <Toast message={toast.message} type={toast.type} onClose={handleToastClose} />
        </div>
      )}
    </MainLayout>
  );
}
