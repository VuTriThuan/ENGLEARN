import { apiRequest } from '../apiClient';

function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const user = entry.user ?? entry.account ?? entry.principal ?? entry;
  const id = user.id ?? user.userId ?? user.user_id ?? entry.userId ?? entry.user_id;
  const username = user.username ?? user.name ?? user.fullName ?? user.full_name ?? '';
  const fullName = user.fullName ?? user.full_name ?? user.name ?? username;
  const email = user.email ?? '';
  const avatarUrl = user.avatarUrl ?? user.avatar_url ?? user.avatar ?? '';

  const score = entry.score ?? entry.totalScore ?? entry.total_score ?? entry.points ?? 0;
  const streak = entry.streak ?? entry.currentStreak ?? entry.current_streak ?? entry.bestStreak ?? entry.best_streak ?? 0;
  const rank = entry.rank ?? entry.position ?? null;

  const isCurrentUser = entry.isCurrentUser ?? entry.is_current_user ?? false;

  return {
    id: id ?? username ?? email,
    username,
    fullName,
    email,
    avatarUrl,
    totalScore: Number(score) || 0,
    score: Number(score) || 0,
    streak: Number(streak) || 0,
    rank: rank != null ? Number(rank) : null,
    isCurrentUser
  };
}

export async function fetchLeaderboard({ sortBy, timeFilter, limit }) {
  const data = await apiRequest('/api/leaderboard', {
    method: 'GET',
    auth: true,
    query: { sortBy, timeFilter, limit }
  });

  const rawList =
    data?.items ??
    data?.entries ??
    data?.data ??
    data?.leaderboard ??
    data?.users ??
    (Array.isArray(data) ? data : []);

  const list = Array.isArray(rawList) ? rawList : [];
  const normalized = list.map(normalizeEntry).filter(Boolean);

  
  return normalized.map((u, idx) => ({ ...u, rank: u.rank ?? idx + 1 }));
}