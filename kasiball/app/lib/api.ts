const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "";

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; errors?: unknown };

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers:
        options?.body && !(options.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : undefined,
      ...options,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: json?.error ?? `Request failed (${res.status})`,
        code: json?.code,
        errors: json?.errors,
      };
    }

    return { success: true, data: json?.data ?? json };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}

function get<T>(path: string) {
  return request<T>(path);
}
function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
  });
}
function patch<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body ?? {}),
  });
}
function put<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body ?? {}),
  });
}
function del<T>(path: string) {
  return request<T>(path, { method: "DELETE" });
}

const qs = (params?: Record<string, string | undefined>) => {
  if (!params) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const api = {
  // ------------------------------------------------------------------ AUTH
  register: (body: unknown) => post("/api/auth/register", body),
  login: (body: { email: string; password: string }) =>
    post("/api/auth/login", body),
  logout: () => post("/api/auth/logout"),
  me: () => get("/api/auth/me"),

  // -------------------------------------------------------------- PUBLIC
  getPublicSeasons: () => get("/api/public/seasons"),
  getPublicSeason: (id: string) => get(`/api/public/seasons/${id}`),
  getPublicStandings: (ageGroupId: string) =>
    get(`/api/public/age-groups/${ageGroupId}/standings`),
  getPublicFixtures: (ageGroupId: string) =>
    get(`/api/public/age-groups/${ageGroupId}/fixtures`),
  getPublicClubs: () => get("/api/public/clubs"),
  getPublicClub: (id: string) => get(`/api/public/clubs/${id}`),
  getPublicTeam: (id: string) => get(`/api/public/teams/${id}`),
  searchPublicPlayers: (q: string) =>
    get(`/api/public/players/search${qs({ q })}`),
  getPublicPlayer: (id: string) => get(`/api/public/players/${id}`),
  getPublicLeaderboard: (
    seasonId: string,
    params?: { sortBy?: string; limit?: string }
  ) => get(`/api/public/seasons/${seasonId}/player-stats${qs(params)}`),

  // --------------------------------------------------------------- ADMIN
  // Seasons
  getAdminSeasons: () => get("/api/admin/seasons"),
  createAdminSeason: (body: unknown) => post("/api/admin/seasons", body),
  getAdminSeason: (id: string) => get(`/api/admin/seasons/${id}`),
  updateAdminSeason: (id: string, body: unknown) =>
    patch(`/api/admin/seasons/${id}`, body),

  // Age groups
  getAdminAgeGroups: (seasonId: string) =>
    get(`/api/admin/seasons/${seasonId}/age-groups`),
  createAdminAgeGroup: (seasonId: string, body: unknown) =>
    post(`/api/admin/seasons/${seasonId}/age-groups`, body),
  getAdminAgeGroup: (id: string) => get(`/api/admin/age-groups/${id}`),
  updateAdminAgeGroup: (id: string, body: unknown) =>
    patch(`/api/admin/age-groups/${id}`, body),

  // Clubs
  getAdminClubs: () => get("/api/admin/clubs"),
  createAdminClub: (body: unknown) => post("/api/admin/clubs", body),
  getAdminClub: (id: string) => get(`/api/admin/clubs/${id}`),
  updateAdminClub: (id: string, body: unknown) =>
    patch(`/api/admin/clubs/${id}`, body),

  // Teams
  getAdminTeams: (params?: { clubId?: string; ageGroupId?: string }) =>
    get(`/api/admin/teams${qs(params)}`),
  getAdminTeam: (id: string) => get(`/api/admin/teams/${id}`),
  updateAdminTeam: (id: string, body: unknown) =>
    patch(`/api/admin/teams/${id}`, body),

  // Team applications
  getAdminTeamApplications: (status?: string) =>
    get(`/api/admin/team-applications${qs({ status })}`),
  getAdminTeamApplication: (id: string) =>
    get(`/api/admin/team-applications/${id}`),
  updateAdminTeamApplication: (id: string, body: unknown) =>
    patch(`/api/admin/team-applications/${id}`, body),
  approveAdminTeamApplication: (id: string) =>
    post(`/api/admin/team-applications/${id}/approve`),

  // Player registrations
  getAdminPlayerRegistrations: (params?: {
    seasonId?: string;
    teamId?: string;
    status?: string;
  }) => get(`/api/admin/player-registrations${qs(params)}`),
  getAdminPlayerRegistration: (id: string) =>
    get(`/api/admin/player-registrations/${id}`),
  verifyAdminPlayerRegistration: (id: string) =>
    post(`/api/admin/player-registrations/${id}/verify`),
  requestChangesAdminPlayerRegistration: (id: string, reviewNotes: string) =>
    post(`/api/admin/player-registrations/${id}/request-changes`, {
      reviewNotes,
    }),
  rejectAdminPlayerRegistration: (id: string, reviewNotes: string) =>
    post(`/api/admin/player-registrations/${id}/reject`, { reviewNotes }),

  // Player documents
  getAdminPlayerDocuments: (params?: {
    registrationId?: string;
    status?: string;
  }) => get(`/api/admin/player-documents${qs(params)}`),
  verifyAdminPlayerDocument: (id: string) =>
    post(`/api/admin/player-documents/${id}/verify`),
  rejectAdminPlayerDocument: (id: string) =>
    post(`/api/admin/player-documents/${id}/reject`),

  // Grounds
  getAdminGrounds: (params?: { isActive?: string }) =>
    get(`/api/admin/grounds${qs(params)}`),
  createAdminGround: (body: unknown) => post("/api/admin/grounds", body),
  getAdminGround: (id: string) => get(`/api/admin/grounds/${id}`),
  updateAdminGround: (id: string, body: unknown) =>
    patch(`/api/admin/grounds/${id}`, body),

  // Referees
  getAdminReferees: (params?: { isActive?: string }) =>
    get(`/api/admin/referees${qs(params)}`),
  createAdminReferee: (body: unknown) => post("/api/admin/referees", body),
  getAdminReferee: (id: string) => get(`/api/admin/referees/${id}`),
  updateAdminReferee: (id: string, body: unknown) =>
    patch(`/api/admin/referees/${id}`, body),

  // Fixtures
  getAdminFixtures: (seasonId: string, ageGroupId: string) =>
    get(`/api/admin/seasons/${seasonId}/age-groups/${ageGroupId}/fixtures`),
  generateAdminFixtures: (
    seasonId: string,
    ageGroupId: string,
    body: { doubleRoundRobin: boolean; balancedHomeAway: boolean }
  ) =>
    post(
      `/api/admin/seasons/${seasonId}/age-groups/${ageGroupId}/fixtures/generate`,
      body
    ),
  clearAdminFixtures: (seasonId: string, ageGroupId: string) =>
    del(`/api/admin/seasons/${seasonId}/age-groups/${ageGroupId}/fixtures`),
  getAdminFixture: (id: string) => get(`/api/admin/fixtures/${id}`),
  scheduleAdminFixture: (id: string, body: unknown) =>
    patch(`/api/admin/fixtures/${id}/schedule`, body),
  unscheduleAdminFixture: (id: string) =>
    del(`/api/admin/fixtures/${id}/schedule`),

  // Matches
  getAdminMatches: (params?: {
    seasonId?: string;
    ageGroupId?: string;
    status?: string;
  }) => get(`/api/admin/matches${qs(params)}`),
  getAdminMatch: (id: string) => get(`/api/admin/matches/${id}`),
  getAdminMatchSquads: (id: string) => get(`/api/admin/matches/${id}/squads`),
  reopenAdminMatch: (id: string) => post(`/api/admin/matches/${id}/reopen`),

  // Standings & stats
  getAdminStandings: (seasonId: string, ageGroupId: string) =>
    get(`/api/admin/seasons/${seasonId}/age-groups/${ageGroupId}/standings`),
  getAdminPlayerStats: (playerId: string) =>
    get(`/api/admin/players/${playerId}/stats`),
  getAdminAgeGroupPlayerStats: (
    seasonId: string,
    ageGroupId: string,
    sortBy?: string
  ) =>
    get(
      `/api/admin/seasons/${seasonId}/age-groups/${ageGroupId}/player-stats${qs(
        { sortBy }
      )}`
    ),
  getAdminSeasonPlayerStats: (seasonId: string, sortBy?: string) =>
    get(`/api/admin/seasons/${seasonId}/player-stats${qs({ sortBy })}`),

  // ------------------------------------------------------------- MANAGER
  getManagerTeamApplications: () => get("/api/manager/team-applications"),
  createManagerTeamApplication: (body: unknown) =>
    post("/api/manager/team-applications", body),
  getManagerTeamApplication: (id: string) =>
    get(`/api/manager/team-applications/${id}`),

  getManagerTeams: () => get("/api/manager/teams"),
  getManagerTeam: (id: string) => get(`/api/manager/teams/${id}`),

  getManagerPlayers: () => get("/api/manager/players"),
  createManagerPlayer: (body: unknown) => post("/api/manager/players", body),
  getManagerPlayer: (id: string) => get(`/api/manager/players/${id}`),
  resubmitManagerPlayer: (id: string, body: unknown) =>
    patch(`/api/manager/players/${id}`, body),

  getPlayerDocuments: (registrationId: string) =>
    get(`/api/manager/players/${registrationId}/documents`),
  uploadPlayerDocument: (registrationId: string, formData: FormData) =>
    post(`/api/manager/players/${registrationId}/documents`, formData),
  getPlayerDocument: (registrationId: string, docId: string) =>
    get(`/api/manager/players/${registrationId}/documents/${docId}`),
  deletePlayerDocument: (registrationId: string, docId: string) =>
    del(`/api/manager/players/${registrationId}/documents/${docId}`),

  getManagerMatchSquad: (matchId: string) =>
    get(`/api/manager/matches/${matchId}/squad`),
  setManagerMatchSquad: (matchId: string, body: unknown) =>
    put(`/api/manager/matches/${matchId}/squad`, body),

  // ------------------------------------------------------------- REFEREE
  getRefereeMatches: () => get("/api/referee/matches"),
  getRefereeMatch: (id: string) => get(`/api/referee/matches/${id}`),
  startRefereeMatch: (id: string) =>
    post(`/api/referee/matches/${id}/start`),
  addRefereeEvent: (id: string, body: unknown) =>
    post(`/api/referee/matches/${id}/events`, body),
  deleteRefereeEvent: (id: string, eventId: string) =>
    del(`/api/referee/matches/${id}/events/${eventId}`),
  submitRefereeMatch: (id: string) =>
    post(`/api/referee/matches/${id}/submit`),
};

export type Api = typeof api;