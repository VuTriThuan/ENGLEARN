import React, { useState, useMemo, useEffect } from "react";
import { Trophy, Flame, Medal, Award, Crown, Star } from "lucide-react";
import { fetchLeaderboard } from "../utils/services/leaderboardService";

function LeaderboardPage({ isAdmin = false }) {
  const [timeFilter, setTimeFilter] = useState("day");
  const [sortBy, setSortBy] = useState("score");
  const [serverUsers, setServerUsers] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLeaderboard({ sortBy, timeFilter, limit: 200 });
        if (!cancelled && data.length > 0) {
          
          const mapped = data.map((u) => ({
            id: u.id,
            username: u.username,
            fullName: u.fullName ?? u.full_name ?? u.username,
            email: u.email,
            avatarUrl:
              u.avatarUrl || `https://i.pravatar.cc/150?u=${String(u.id)}`,
            totalScoreAll: timeFilter === "all" ? u.score : 0,
            scoreInDay: timeFilter === "day" ? u.score : 0,
            streak: u.streak || 0,
            isCurrentUser: u.isCurrentUser ?? false,
            rank: u.rank,
          }));
          setServerUsers(mapped);
        } else if (!cancelled) {
          setServerUsers(null);
        }
      } catch {
        if (!cancelled) setServerUsers(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [sortBy, timeFilter]);

  
  const rankedUsers = useMemo(() => {
    const base = serverUsers && serverUsers.length > 0 ? serverUsers : [];
    const sorted = [...base];

    const getScore = (u) =>
      timeFilter === "day" ? u.scoreInDay : u.totalScoreAll;

    sorted.sort((a, b) => getScore(b) - getScore(a));

    
    return sorted.map((user, index) => ({
      ...user,
      rank: user.rank ?? index + 1,
      _displayScore: getScore(user),
    }));
  }, [timeFilter, sortBy, serverUsers]);

  const top3 = rankedUsers.slice(0, 3);
  const remainingUsers = rankedUsers.slice(3, 100);
  const currentUserRankInfo = rankedUsers.find((u) => u.isCurrentUser);
  const isOutsideTop100 = currentUserRankInfo && currentUserRankInfo.rank > 100;

  
  const PodiumCard = ({ user, position }) => {
    if (!user) return null;

    const isFirst = position === 1;
    const isSecond = position === 2;

    const height = isFirst ? "h-56" : isSecond ? "h-48" : "h-40";
    const bgColor = isFirst
      ? "bg-gradient-to-t from-yellow-200 to-yellow-50 border-yellow-300"
      : isSecond
        ? "bg-gradient-to-t from-gray-200 to-gray-50 border-gray-300"
        : "bg-gradient-to-t from-orange-200 to-orange-50 border-orange-300";

    return (
      <div
        className={`flex flex-col items-center justify-end ${isFirst ? "z-10 -mx-4" : "z-0"} w-1/3 max-w-[190px]`}
      >
        <div className="relative mb-6 flex flex-col items-center">
          {isFirst && (
            <Crown
              className="absolute -top-8 text-yellow-500 fill-yellow-500 animate-bounce"
              size={32}
            />
          )}
          <img
            src={user.avatarUrl}
            alt={user.fullName || user.username}
            className={`rounded-full object-cover border-4 shadow-md ${isFirst ? "w-24 h-24 border-yellow-400" : "w-20 h-20 border-gray-300"}`}
          />
          <div
            className={`absolute -bottom-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-white shadow-lg ${isFirst ? "bg-yellow-500" : isSecond ? "bg-gray-400" : "bg-orange-500"}`}
          >
            {user.rank}
          </div>
        </div>

        <div
          className={`w-full ${height} ${bgColor} border rounded-t-2xl shadow-lg flex flex-col items-center p-4 text-center transition-all hover:-translate-y-2`}
        >
          <h3
            className={`font-bold truncate w-full mt-2 ${isFirst ? "text-lg text-yellow-900" : "text-base text-gray-800"}`}
          >
            {user.fullName}
          </h3>
          <p
            className={`text-[10px] truncate w-full -mt-0.5 mb-1 ${isFirst ? "text-yellow-700/80" : "text-gray-500"}`}
          >
            {user.email}
          </p>

          <div className="mt-auto w-full flex flex-col gap-1.5 items-center border-t border-black/10 pt-2.5">

            <div className="flex items-center gap-1.5 w-full justify-center px-2 py-1 rounded-lg bg-yellow-500/15">
              <Trophy size={18} className="text-yellow-600" />
              <span className="font-black text-xl text-yellow-700">
                {user._displayScore.toLocaleString()}
              </span>
              <span className="text-xs text-yellow-600 font-bold">điểm</span>
            </div>

            <div className="flex items-center gap-1.5 w-full justify-center text-orange-600 font-bold mt-1">
              <Flame size={16} className="fill-orange-500 text-orange-500" />
              <span className="text-sm">
                {user.streak} <span className="text-xs font-medium">ngày</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen flex flex-col">

      <div className="flex flex-col items-center mb-10 space-y-6">

        <div className="w-full flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-cyan-950">
              Bảng xếp hạng
            </h1>
            <p className="text-gray-500 mt-1 font-medium">
              Vinh danh những cá nhân xuất sắc nhất
            </p>
          </div>

          <div className="flex bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
            {[
              { id: "day", label: "Ngày" },
              { id: "all", label: "Tất cả" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                  timeFilter === tab.id
                    ? "bg-cyan-600 text-white shadow-md"
                    : "text-gray-500 hover:text-cyan-700 hover:bg-cyan-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="text-sm font-bold text-gray-400">
            Đang tải bảng xếp hạng...
          </div>
        )}
      </div>


      <div className="flex justify-center items-end gap-2 mb-8 max-w-4xl mx-auto w-full pt-16 relative z-0">
        <PodiumCard user={top3[1]} position={2} />
        <PodiumCard user={top3[0]} position={1} />
        <PodiumCard user={top3[2]} position={3} />
      </div>


      <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 max-h-[500px] relative">

        <div className="flex items-center px-6 py-4 bg-cyan-50 border-b border-cyan-100 text-xs font-extrabold text-cyan-900 uppercase tracking-wider sticky top-0 z-30">
          <div className="w-16 text-center">Hạng</div>
          <div className="flex-1 pl-4">Người dùng</div>


          <div className="w-24 text-center text-orange-600">Chuỗi</div>


          <div className="w-32 text-center text-yellow-600">Tổng điểm</div>
        </div>


        <div className="overflow-y-auto flex-1 scrollbar-thin scroll-smooth relative">
          {remainingUsers.map((user) => (
            <div
              key={user.id}
              className={`flex items-center px-6 py-3 transition-colors ${
                !isAdmin && user.isCurrentUser
                  ? "bg-white sticky top-0 bottom-0 z-20 border-y-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-white hover:bg-gray-50 border-b border-gray-50"
              }`}
            >
              <div className="w-16 flex justify-center">
                <span
                  className={`font-black text-lg ${!isAdmin && user.isCurrentUser ? "text-cyan-700" : "text-gray-400"}`}
                >
                  {user.rank}
                </span>
              </div>

              <div className="flex-1 flex items-center gap-4 pl-4">
                <img
                  src={user.avatarUrl}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div className="flex flex-col">
                  <span
                    className={`font-bold ${!isAdmin && user.isCurrentUser ? "text-cyan-900" : "text-gray-800"}`}
                  >
                    {user.fullName}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {user.email}
                  </span>
                </div>
              </div>


              <div className="w-24 flex items-center justify-center gap-1.5 text-orange-600 font-bold bg-orange-50/50 py-1 rounded-lg mr-4 border border-orange-100">
                <Flame size={16} className="fill-orange-500 text-orange-500" />
                <span className="text-sm">{user.streak}</span>
              </div>


              <div className="w-32 text-center font-black text-base flex items-center justify-center gap-1.5 text-yellow-600 bg-yellow-50/50 py-1 rounded-lg">
                {user._displayScore.toLocaleString()}{" "}
                <Trophy
                  size={16}
                  fill="currentColor"
                  className="text-yellow-500"
                />
              </div>
            </div>
          ))}
          {isOutsideTop100 && <div className="py-12 bg-white" />}
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;