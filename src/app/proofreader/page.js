import MainLayout from '@/components/MainLayout';
import ProofreaderPlayground from '@/components/ProofreaderPlayground';

export default function ProofreaderPage() {
  return (
    <MainLayout>
      <div className="p-8 lg:p-12 max-w-6xl mx-auto">
        <ProofreaderPlayground />
      </div>
    </MainLayout>
  );
}
