import { saveUpload } from "@/lib/upload";

const TONES = ["orange", "dark", "blue", "green", "rose"];

export async function parseBanner(form) {
  const title = form.get("title")?.toString().trim().slice(0, 90);
  if (!title) throw new Error("Banner sarlavhasini kiriting");
  let link = form.get("link")?.toString().trim() || "";
  if (link && !/^(\/|#|https:\/\/)/.test(link)) throw new Error("Havola / bilan (masalan /catalog?sale=1) yoki https:// bilan boshlanishi kerak");
  const tone = TONES.includes(form.get("tone")) ? form.get("tone") : "orange";
  const data = {
    title,
    subtitle: form.get("subtitle")?.toString().trim().slice(0, 200) || null,
    buttonText: form.get("buttonText")?.toString().trim().slice(0, 30) || null,
    link: link || null,
    tone,
    active: form.get("active") === "on",
  };
  const img = form.get("image");
  if (img && img.size > 0) data.imageUrl = await saveUpload(img, "image");
  else if (form.get("removeImage") === "1") data.imageUrl = null;
  return data;
}
