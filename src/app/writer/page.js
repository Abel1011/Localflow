import MainLayout from '@/components/MainLayout';
import WriterPlayground from '@/components/WriterPlayground';

export default function WriterPage() {
  return (
    <MainLayout>
      <div className="p-8 lg:p-12 max-w-6xl mx-auto">
        <WriterPlayground />
      </div>
    </MainLayout>
  );
}
