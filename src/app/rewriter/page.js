import MainLayout from '@/components/MainLayout';
import RewriterPlayground from '@/components/RewriterPlayground';

export default function RewriterPage() {
  return (
    <MainLayout>
      <div className="p-8 lg:p-12 max-w-6xl mx-auto">
        <RewriterPlayground />
      </div>
    </MainLayout>
  );
}
