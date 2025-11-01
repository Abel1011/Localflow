'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import BulkFlowRunner from '@/components/workflow/BulkFlowRunner';
import Toast from '@/components/ui/Toast';
import { getFlow } from '@/lib/workflowStorage';

export default function RunFlowPage() {
  const params = useParams();
  const router = useRouter();
  const flowId = Number(params?.id);
  const [flow, setFlow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const data = await getFlow(flowId);
        if (!isMounted) {
          return;
        }
        if (!data) {
          setToast({ message: 'Flow not found.', type: 'error' });
        }
        setFlow(data);
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

  const handleToastClose = () => {
    setToast(null);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-slate-500 font-semibold">Loading flow...</div>
        </div>
      </MainLayout>
    );
  }

  if (!flow) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6">
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
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <BulkFlowRunner flow={flow} />
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
