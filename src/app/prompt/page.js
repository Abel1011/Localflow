import MainLayout from '@/components/MainLayout';
import PromptPlayground from '@/components/PromptPlayground';

export default function PromptPage() {
  return (
    <MainLayout>
      <div className="p-8 lg:p-12 max-w-6xl mx-auto">
        <PromptPlayground />
      </div>
    </MainLayout>
  );
}
