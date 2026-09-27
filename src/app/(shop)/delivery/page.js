import InfoPage, { TextBlock } from "@/components/InfoPage";
import { getPages } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Yetkazib berish va to'lov" };

export default async function Page() {
  const pages = await getPages();
  return (
    <InfoPage title="Yetkazib berish va to'lov" current="/delivery">
      <TextBlock text={pages.delivery} />
    </InfoPage>
  );
}
