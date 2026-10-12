import { api } from "./api";

export type PublicSeason = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
};

export type PublicAgeGroup = {
  id: string;
  name: string;
  minAge: number | null;
  maxAge: number | null;
};

export async function getDefaultSeason(): Promise<PublicSeason | null> {
  const res = await api.getPublicSeasons();
  if (!res.success || !res.data?.length) return null;

  const seasons = res.data as PublicSeason[];
  return seasons.find((s) => s.status === "ACTIVE") ?? seasons[0];
}

export async function getSeasonAgeGroups(
  seasonId: string
): Promise<PublicAgeGroup[]> {
  const res = await api.getPublicSeason(seasonId);
  if (!res.success) return [];
  const season = res.data as { ageGroups?: PublicAgeGroup[] };
  return season.ageGroups ?? [];
}