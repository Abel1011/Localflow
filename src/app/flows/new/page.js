'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import FlowBuilder from '@/components/WorkflowBuilder';
import { createFlow } from '@/lib/workflowStorage';

export default function NewFlowPage() {
  const router = useRouter();
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

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
      await createFlow({
        name: trimmedName,
        description: metadata.description,
        nodes,
        edges
      });
      setIsSaving(false);
      router.push('/flows');
    } catch (error) {
      setIsSaving(false);
      throw error;
    }
  };

  return (
    <MainLayout>
      <FlowBuilder
        key="new-flow"
        initialWorkflow={{ nodes: [], edges: [] }}
        metadata={metadata}
        onMetadataChange={handleMetadataChange}
        onSave={handleSave}
        isSaving={isSaving}
        saveButtonLabel="Create Flow"
      />
    </MainLayout>
  );
}
