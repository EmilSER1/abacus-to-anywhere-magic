import { Navigation } from '@/components/Navigation'
import HomePage from './HomePage'

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <HomePage />
      </main>
    </div>
  );
};

export default Index;
