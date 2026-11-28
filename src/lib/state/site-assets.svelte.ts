export const siteAssets = $state<{ banner: string | null }>({ banner: null });

export function useSiteAssets(banner: string | null): void {
  siteAssets.banner = banner;
}
