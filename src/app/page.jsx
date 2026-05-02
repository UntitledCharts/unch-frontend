import HomeClient from "./HomeClient";

const APILink = process.env.NEXT_PUBLIC_API_URL;

function getLcpUrl(item, baseUrl) {
  const coverHash = item.jacket_file_hash || (item.cover ? item.cover.hash : null);
  const bgHash = item.background_v3_file_hash || (item.backgroundV3 ? item.backgroundV3.hash : null)
    || item.background_file_hash || (item.background ? item.background.hash : null);
  if (baseUrl && item.author) {
    return bgHash
      ? `${baseUrl}/${item.author}/${item.id}/${bgHash}`
      : coverHash
        ? `${baseUrl}/${item.author}/${item.id}/${coverHash}`
        : null;
  }
  return null;
}

export default async function Home() {
  let lcpImageUrl = null;
  let lcpCoverUrl = null;
  try {
    const res = await fetch(`${APILink}/api/charts?type=advanced&staff_pick=1&limit=1`, { next: { revalidate: 60 } });
    if (res.ok) {
      const json = await res.json();
      const base = json.asset_base_url || "";
      const first = json.data?.[0];
      if (first) {
        lcpImageUrl = getLcpUrl(first, base);
        const coverHash = first.jacket_file_hash || (first.cover ? first.cover.hash : null);
        if (base && coverHash && first.author) {
          lcpCoverUrl = `${base}/${first.author}/${first.id}/${coverHash}`;
        }
      }
    }
  } catch (e) {}

  return (
    <>
      {lcpImageUrl && <link rel="preload" as="image" href={lcpImageUrl} fetchPriority="high" />}
      {lcpCoverUrl && lcpCoverUrl !== lcpImageUrl && <link rel="preload" as="image" href={lcpCoverUrl} />}
      <HomeClient />
    </>
  );
}
