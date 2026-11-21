import React, { useState, useEffect, useMemo } from 'react';
import {
  Github,
  BookOpen,
  ExternalLink,
  GitBranch,
  Star,
  GitFork,
  Copy,
  Check,
} from 'lucide-react';
import { GlitchHeading } from './ui/GlitchHeading';

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

interface GitHubUser {
  login: string;
  public_repos: number;
  followers: number;
  avatar_url: string;
  bio: string | null;
}

interface GitHubSectionProps {
  inSheet?: boolean;
  id?: string;
}

const CACHE_KEY = 'gs_github_telemetry_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#38bdf8',
  JavaScript: '#fbbf24',
  Python: '#34d399',
  CSS: '#818cf8',
  HTML: '#f97316',
  C: '#94a3b8',
};

function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return 'RECENT';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'RECENT';
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return 'UPDATED TODAY';
  if (days === 1) return '1D AGO';
  if (days < 30) return `${days}D AGO`;
  const months = Math.floor(days / 30);
  return `${months}MO AGO`;
}

export const GitHubSection: React.FC<GitHubSectionProps> = ({
  inSheet = false,
  id = 'github-telemetry',
}) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [copiedRepoUrl, setCopiedRepoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchGitHubData() {
      // Check sessionStorage cache first
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            ts: number;
            user: GitHubUser | null;
            repos: GitHubRepo[];
          };
          if (Date.now() - parsed.ts < CACHE_TTL_MS && Array.isArray(parsed.repos) && parsed.repos.length > 0) {
            if (isMounted) {
              setUser(parsed.user);
              setRepos(parsed.repos);
            }
            return;
          }
        }
      } catch {
        // ignore cache errors
      }

      try {
        const userRes = await fetch('https://api.github.com/users/garvshaw89-glitch', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (userRes.status === 403 || userRes.status === 429) {
          if (isMounted) setIsRateLimited(true);
          return;
        }

        let fetchedUser: GitHubUser | null = null;
        if (userRes.ok) {
          fetchedUser = await userRes.json();
          if (isMounted) setUser(fetchedUser);
        }

        const reposRes = await fetch(
          'https://api.github.com/users/garvshaw89-glitch/repos?sort=updated&per_page=6',
          {
            headers: { Accept: 'application/vnd.github.v3+json' },
          }
        );

        if (reposRes.ok) {
          const reposData = await reposRes.json();
          const list = Array.isArray(reposData) ? reposData : [];
          if (isMounted) {
            setRepos(list);
          }
          try {
            sessionStorage.setItem(
              CACHE_KEY,
              JSON.stringify({ ts: Date.now(), user: fetchedUser, repos: list })
            );
          } catch {
            // ignore storage quota
          }
        }
      } catch {
        if (isMounted) setIsRateLimited(true);
      }
    }

    fetchGitHubData();
    return () => {
      isMounted = false;
    };
  }, []);

  const fallbackRepos: GitHubRepo[] = [
    {
      id: 1,
      name: 'StockMentor',
      description: 'Quantitative FinTech trading terminal with Socratic AI market literacy engine.',
      html_url: 'https://github.com/garvshaw89-glitch/StockMentor',
      language: 'TypeScript',
      stargazers_count: 14,
      forks_count: 3,
      updated_at: '',
    },
    {
      id: 2,
      name: 'Salary-OS',
      description: 'Personal finance and compensation forecasting intelligence suite with budget modeling.',
      html_url: 'https://github.com/garvshaw89-glitch/Salary-OS',
      language: 'TypeScript',
      stargazers_count: 11,
      forks_count: 2,
      updated_at: '',
    },
    {
      id: 3,
      name: 'MicroSkill-Version-1.0',
      description: 'Spaced repetition algorithms and interactive computer science coding arcade.',
      html_url: 'https://github.com/garvshaw89-glitch/MicroSkill-Version-1.0',
      language: 'TypeScript',
      stargazers_count: 9,
      forks_count: 2,
      updated_at: '',
    },
    {
      id: 4,
      name: 'Typing-Speed-Checker-',
      description: 'Real-time keystroke velocity analytics engine and error heatmap.',
      html_url: 'https://github.com/garvshaw89-glitch/Typing-Speed-Checker-',
      language: 'JavaScript',
      stargazers_count: 8,
      forks_count: 1,
      updated_at: '',
    },
  ];

  const displayedRepos = repos.length > 0 && !isRateLimited ? repos : fallbackRepos;

  const languageBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    displayedRepos.forEach((r) => {
      const lang = r.language || 'TypeScript';
      counts.set(lang, (counts.get(lang) || 0) + 1);
    });
    const total = Math.max(1, displayedRepos.length);
    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        pct: Math.round((count / total) * 100),
        color: LANG_COLORS[name] || '#7EA7FF',
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [displayedRepos]);

  const handleCopyClone = (e: React.MouseEvent, htmlUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`git clone ${htmlUrl}.git`);
      setCopiedRepoUrl(htmlUrl);
      window.setTimeout(() => setCopiedRepoUrl(null), 2000);
    }
  };

  const content = (
    <div className="max-w-7xl mx-auto">
      {/* Unified Section Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-12 sm:mb-14">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sky-400 font-semibold text-xs">05</span>
          <span aria-hidden="true" className="text-white/25 font-mono text-xs">·</span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A7ADB5]">
            OPEN SOURCE &amp; CODE ACTIVITY
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[#626A73]">
          GITHUB REPOSITORIES
        </span>
      </div>

      {/* Section Title & Profile Meta */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <GlitchHeading className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-[#F2F3F5] mb-3">
            ENGINEERING.
          </GlitchHeading>
          <p className="font-sans text-[#A7ADB5] text-sm sm:text-base leading-relaxed font-light max-w-xl [text-wrap:balance]">
            Verified public repositories and continuous development activity across artificial intelligence, microservices, and web utilities.
          </p>
        </div>

        <a
          href="https://github.com/garvshaw89-glitch"
          target="_blank"
          rel="noopener noreferrer"
          data-cursor="link"
          data-cursor-label="GITHUB"
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#070A10]/94 hover:bg-[#0B101A] border border-white/[0.12] hover:border-sky-400/50 transition-all duration-300 shadow-[0_14px_40px_rgba(0,0,0,0.75)] group w-fit"
        >
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-sky-400 via-indigo-500 to-cyan-300 shrink-0">
            <img
              src="/github_avatar.png"
              alt="Garv Shaw GitHub Avatar"
              className="w-full h-full object-cover rounded-full bg-[#050608]"
            />
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#F2F3F5] group-hover:text-sky-300 transition-colors">
              <Github className="w-3.5 h-3.5 text-sky-400" />
              <span>@garvshaw89-glitch</span>
              <ExternalLink className="w-3 h-3 text-[#626A73] group-hover:text-sky-400 transition-colors" />
            </div>
            <span className="text-[10px] font-mono text-[#626A73] uppercase tracking-wider">
              {user ? `${user.public_repos} Public Repositories` : '18+ Public Repositories'}
            </span>
          </div>
        </a>
      </div>

      {/* Verified Engineering Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            REPOSITORIES
          </span>
          <span className="font-editorial text-3xl sm:text-4xl font-bold text-[#F2F3F5] tabular-nums">
            {user ? user.public_repos : '18+'}
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            FLAGSHIPS
          </span>
          <span className="font-editorial text-3xl sm:text-4xl font-bold text-sky-400 tabular-nums">
            05
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            PRIMARY STACK
          </span>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#F2F3F5]">
            {languageBreakdown[0]?.name || 'TypeScript'}
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            ARCHITECTURE
          </span>
          <span className="font-editorial text-xl sm:text-2xl font-bold text-indigo-300 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-400 shrink-0" />
            AI · Cloud
          </span>
        </div>
      </div>

      {/* Language Composition Strip */}
      <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-[#070A10]/92 border border-white/[0.09]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73]">
            ACTIVE CODEBASE DISTRIBUTION
          </span>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            {languageBreakdown.map((lang) => (
              <span key={lang.name} className="inline-flex items-center gap-1.5 text-[#D5D9DF]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: lang.color }}
                />
                <span>{lang.name}</span>
                <span className="text-[#626A73] tabular-nums">{lang.pct}%</span>
              </span>
            ))}
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden flex">
          {languageBreakdown.map((lang) => (
            <div
              key={lang.name}
              style={{ width: `${lang.pct}%`, backgroundColor: lang.color }}
              className="h-full transition-all duration-500"
              title={`${lang.name}: ${lang.pct}%`}
            />
          ))}
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {displayedRepos.map((repo) => {
          const langName = repo.language || 'TypeScript';
          const langColor = LANG_COLORS[langName] || '#7EA7FF';
          const isCopied = copiedRepoUrl === repo.html_url;

          return (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              data-cursor-label="REPO"
              className="p-6 sm:p-7 rounded-2xl bg-[#070A10]/92 border border-white/[0.09] hover:border-sky-400/45 hover:bg-[#0B1018] transition-all duration-300 group flex flex-col justify-between shadow-[0_18px_50px_rgba(0,0,0,0.7)]"
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <span className="font-editorial text-lg sm:text-xl font-bold text-[#F2F3F5] group-hover:text-sky-300 transition-colors flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">{repo.name}</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopyClone(e, repo.html_url)}
                      data-cursor="button"
                      data-cursor-label="CLONE"
                      title={`Copy: git clone ${repo.html_url}.git`}
                      aria-label={`Copy git clone command for ${repo.name}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] font-mono text-[10px] text-[#A7ADB5] hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">CLONED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="hidden sm:inline">git clone</span>
                        </>
                      )}
                    </button>
                    <ExternalLink className="w-4 h-4 text-[#626A73] group-hover:text-sky-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </div>
                </div>
                <p className="font-sans text-sm text-[#A7ADB5] font-light leading-relaxed mb-5">
                  {repo.description || 'Public software repository by Garv Shaw.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3.5 border-t border-white/[0.06] font-mono text-xs text-[#626A73]">
                <div className="flex items-center gap-3.5">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: langColor }}
                    />
                    {langName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#A7ADB5] tabular-nums">
                    <Star className="w-3 h-3 text-amber-400/80" />
                    {repo.stargazers_count}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#A7ADB5] tabular-nums">
                    <GitFork className="w-3 h-3 text-slate-400" />
                    {repo.forks_count}
                  </span>
                </div>
                <span className="uppercase tracking-wider text-[10px]">
                  {formatRelativeDate(repo.updated_at)}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );

  if (inSheet) {
    return <div className="select-none">{content}</div>;
  }

  return (
    <section
      id={id}
      className="relative w-full py-20 sm:py-26 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      {content}
    </section>
  );
};
