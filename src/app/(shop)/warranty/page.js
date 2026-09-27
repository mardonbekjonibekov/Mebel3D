import InfoPage, { TextBlock } from "@/components/InfoPage";
import { getPages } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kafolat va qaytarish" };

export default async function Page() {
  const pages = await getPages();
  return (
    <InfoPage title="Kafolat va qaytarish" current="/warranty">
      <TextBlock text={pages.warranty} />
    </InfoPage>
  );
}
