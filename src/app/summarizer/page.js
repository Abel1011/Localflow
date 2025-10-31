import MainLayout from '../../components/MainLayout';
import SummarizerPlayground from '../../components/SummarizerPlayground';

export default function SummarizerPage() {
  return (
    <MainLayout>
        <div className="p-8 lg:p-12 max-w-6xl mx-auto">
            <SummarizerPlayground />
        </div>
    </MainLayout>
  );
}
