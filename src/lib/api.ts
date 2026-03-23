const BASE_URL = "https://www.abgeordnetenwatch.de/api/v2";

// Current Bundestag period (21. Bundestag, 2025-2029)
export const CURRENT_PARLIAMENT_PERIOD_ID = 161;
// Previous Bundestag (20. Bundestag, 2021-2025)
export const PREVIOUS_PARLIAMENT_PERIOD_ID = 132;

interface ApiResponse<T> {
  meta: { api_version: string };
  status: string;
  result: { count: number; total: number; range_start: number; range_end: number };
  data: T;
}

async function fetchApi<T>(path: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchApiDirect<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────

export interface Politician {
  id: number;
  entity_type: string;
  label: string;
  first_name: string;
  last_name: string;
  sex: string | null;
  year_of_birth: number | null;
  party: { id: number; label: string; api_url: string } | null;
  education: string | null;
  residence: string | null;
  occupation: string | null;
  statistic_questions: number | null;
  statistic_questions_answered: number | null;
  field_title: string | null;
  api_url: string;
  abgeordnetenwatch_url: string;
}

export interface Mandate {
  id: number;
  entity_type: string;
  label: string;
  api_url: string;
  type: string;
  parliament_period: { id: number; label: string; api_url: string };
  politician: { id: number; label: string; api_url: string };
  start_date: string | null;
  end_date: string | null;
  fraction_membership: Array<{
    id: number;
    label: string;
    fraction: { id: number; label: string };
    valid_from: string;
    valid_until: string | null;
  }> | null;
  electoral_data: {
    constituency: { id: number; label: string } | null;
    list_position: number | null;
    mandate_won: string | null;
  } | null;
}

export interface Vote {
  id: number;
  entity_type: string;
  label: string;
  mandate: { id: number; label: string };
  poll: {
    id: number;
    label: string;
    api_url: string;
    abgeordnetenwatch_url: string;
    field_poll_date?: string;
  };
  vote: "yes" | "no" | "abstain" | "no_show";
  reason_no_show: string | null;
  fraction: { id: number; label: string } | null;
}

export interface Poll {
  id: number;
  entity_type: string;
  label: string;
  field_accepted: boolean | null;
  field_poll_date: string;
  field_intro: string | null;
  field_topics: Array<{ id: number; label: string }> | null;
}

export interface Sidejob {
  id: number;
  entity_type: string;
  label: string;
  income_level: string | null;
  income: number | null;
  income_total: number | null;
  interval: string | null;
  created: number;
  sidejob_organization: { id: number; label: string } | null;
  additional_information: string | null;
  category: string | null;
  data_change_date: string | null;
}

export interface CommitteeMembership {
  id: number;
  entity_type: string;
  label: string;
  committee: { id: number; label: string };
  candidacy_mandate: { id: number; label: string };
  committee_role: string;
}

// ── API Functions ──────────────────────────────────────────────────────

export async function searchPoliticians(query: string): Promise<Politician[]> {
  // Try splitting into first/last name
  const parts = query.trim().split(/\s+/);
  let data: Politician[];

  if (parts.length >= 2) {
    const res = await fetchApi<Politician[]>("/politicians", {
      first_name: parts[0],
      last_name: parts.slice(1).join(" "),
      range_end: 20,
    });
    data = res.data;
  } else {
    // Search by last name
    const res = await fetchApi<Politician[]>("/politicians", {
      last_name: query.trim(),
      range_end: 20,
    });
    data = res.data;

    // If no results, try first name
    if (data.length === 0) {
      const res2 = await fetchApi<Politician[]>("/politicians", {
        first_name: query.trim(),
        range_end: 20,
      });
      data = res2.data;
    }
  }

  return data;
}

export async function getPolitician(id: number): Promise<Politician> {
  const res = await fetchApiDirect<Politician>(`${BASE_URL}/politicians/${id}`);
  return res.data;
}

export async function getMandatesForPolitician(politicianId: number): Promise<Mandate[]> {
  const res = await fetchApi<Mandate[]>("/candidacies-mandates", {
    politician: politicianId,
    range_end: 50,
  });
  return res.data || [];
}

export async function getVotesForMandate(mandateId: number, rangeEnd = 100): Promise<Vote[]> {
  const res = await fetchApi<Vote[]>("/votes", {
    mandate: mandateId,
    range_end: rangeEnd,
  });
  return res.data || [];
}

export async function getSidejobsForMandate(mandateId: number): Promise<Sidejob[]> {
  const res = await fetchApi<Sidejob[]>("/sidejobs", {
    mandates: mandateId,
    range_end: 100,
  });
  return res.data || [];
}

export async function getCommitteeMembershipsForMandate(mandateId: number): Promise<CommitteeMembership[]> {
  const res = await fetchApi<CommitteeMembership[]>("/committee-memberships", {
    candidacy_mandate: mandateId,
    range_end: 50,
  });
  return res.data || [];
}

export async function getPoll(pollId: number): Promise<Poll> {
  const res = await fetchApiDirect<Poll>(`${BASE_URL}/polls/${pollId}`);
  return res.data;
}

export async function getVotesForPoll(pollId: number, rangeEnd = 800): Promise<Vote[]> {
  const res = await fetchApi<Vote[]>("/votes", {
    poll: pollId,
    range_end: rangeEnd,
  });
  return res.data || [];
}

// Fetch all Bundestag mandates for current period (for averages)
export async function getBundestagMandates(periodId = CURRENT_PARLIAMENT_PERIOD_ID): Promise<Mandate[]> {
  const res = await fetchApi<Mandate[]>("/candidacies-mandates", {
    parliament_period: periodId,
    type: "mandate",
    range_end: 800,
  });
  return res.data || [];
}

// ── Helper: Compute fraction loyalty from votes ────────────────────────

export interface VoteStats {
  totalPolls: number;
  attended: number;
  attendanceRate: number;
  votedYes: number;
  votedNo: number;
  abstained: number;
  noShow: number;
}

export function computeVoteStats(votes: Vote[]): VoteStats {
  const totalPolls = votes.length;
  const attended = votes.filter((v) => v.vote !== "no_show").length;
  return {
    totalPolls,
    attended,
    attendanceRate: totalPolls > 0 ? (attended / totalPolls) * 100 : 0,
    votedYes: votes.filter((v) => v.vote === "yes").length,
    votedNo: votes.filter((v) => v.vote === "no").length,
    abstained: votes.filter((v) => v.vote === "abstain").length,
    noShow: votes.filter((v) => v.vote === "no_show").length,
  };
}

// Income level mapping from API
export function getIncomeRange(level: string | null): string {
  const levels: Record<string, string> = {
    "1": "1.000 – 3.500 €",
    "2": "3.500 – 7.000 €",
    "3": "7.000 – 15.000 €",
    "4": "15.000 – 30.000 €",
    "5": "30.000 – 75.000 €",
    "6": "75.000 – 100.000 €",
    "7": "100.000 – 150.000 €",
    "8": "150.000 – 250.000 €",
    "9": "über 250.000 €",
    "10": "unter 1.000 €",
  };
  return levels[level || ""] || "Keine Angabe";
}
