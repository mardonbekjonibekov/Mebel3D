import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toaster from "@/components/Toaster";
import ScrollProgress from "@/components/ScrollProgress";
import MobileTabBar from "@/components/MobileTabBar";
import AiAssistant from "@/components/AiAssistant";

export default function ShopLayout({ children }) {
  return (
    <div className="shop flex min-h-screen flex-col">
      <ScrollProgress />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileTabBar />
      <AiAssistant />
      <Toaster />
    </div>
  );
}
