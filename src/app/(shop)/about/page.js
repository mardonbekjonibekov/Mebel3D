import InfoPage, { TextBlock } from "@/components/InfoPage";
import { getPages } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Biz haqimizda" };

export default async function Page() {
  const pages = await getPages();
  return (
    <InfoPage title="Biz haqimizda" current="/about">
      <TextBlock text={pages.about} />
    </InfoPage>
  );
}
