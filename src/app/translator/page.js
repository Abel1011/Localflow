import MainLayout from '../../components/MainLayout';
import TranslatorPlayground from '../../components/TranslatorPlayground';

export default function TranslatorPage() {
  return (
    <MainLayout>
        <div className="p-8 lg:p-12 max-w-6xl mx-auto">
            <TranslatorPlayground />
        </div>
    </MainLayout>
  );
}
