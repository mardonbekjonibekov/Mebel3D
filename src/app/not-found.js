import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFoundView from "@/components/NotFoundView";

export const metadata = { title: "Sahifa topilmadi" };

export default function GlobalNotFound() {
  return (
    <div className="shop flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <NotFoundView />
      </main>
      <Footer />
    </div>
  );
}
