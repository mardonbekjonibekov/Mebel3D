import CatalogView from "@/components/CatalogView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Katalog" };

export default async function CatalogPage({ searchParams }) {
  return <CatalogView searchParams={await searchParams} />;
}
