import React, { useState, useEffect } from 'react';
import { Github, Star, GitFork, BookOpen, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

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
  id?: string;
}

export const GitHubSection: React.FC<GitHubSectionProps> = ({ id = 'github-telemetry' }) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchGitHubData() {
      setIsLoading(true);
      try {
        // Fetch user profile
        const userRes = await fetch('https://api.github.com/users/garvshaw89-glitch', {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (userRes.status === 403 || userRes.status === 429) {
          if (isMounted) setIsRateLimited(true);
          return;
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          if (isMounted) setUser(userData);
        }

        // Fetch user repos
        const reposRes = await fetch(
          'https://api.github.com/users/garvshaw89-glitch/repos?sort=updated&per_page=6',
          {
            headers: { Accept: 'application/vnd.github.v3+json' },
          }
        );

        if (reposRes.ok) {
          const reposData = await reposRes.json();
          if (isMounted) {
            setRepos(Array.isArray(reposData) ? reposData : []);
          }
        }
      } catch (err) {
        console.warn('GitHub API request failed, using cached fallback profile:', err);
        if (isMounted) setIsRateLimited(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchGitHubData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Verified fallback repositories if GitHub API is rate-limited
  const fallbackRepos: Array<{
    name: string;
    description: string;
    url: string;
    language: string;
  }> = [
    {
      name: 'StockMentor',
      description: 'Quantitative FinTech trading terminal with Socratic AI market literacy engine.',
      url: 'https://github.com/garvshaw89-glitch/StockMentor',
      language: 'TypeScript',
    },
    {
      name: 'Salary-OS',
      description: 'Personal finance and compensation forecasting intelligence suite with budget modeling.',
      url: 'https://github.com/garvshaw89-glitch/Salary-OS',
      language: 'TypeScript',
    },
    {
      name: 'MicroSkill-Version-1.0',
      description: 'Spaced repetition algorithms and interactive computer science coding arcade.',
      url: 'https://github.com/garvshaw89-glitch/MicroSkill-Version-1.0',
      language: 'TypeScript',
    },
    {
      name: 'Typing-Speed-Checker-',
      description: 'Futuristic real-time keystroke velocity analytics engine and error heatmap.',
      url: 'https://github.com/garvshaw89-glitch/Typing-Speed-Checker-',
      language: 'JavaScript',
    },
  ];

  return (
    <section
      id={id}
      className="relative w-full py-20 px-4 sm:px-6 md:px-10 bg-transparent overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-widest mb-3">
              <Github className="w-3.5 h-3.5" />
              <span>07 // GITHUB TELEMETRY</span>
            </div>
            <h2 className="hero-heading font-display font-black uppercase text-3xl sm:text-5xl tracking-tight">
              OPEN SOURCE REPOSITORIES
            </h2>
          </div>

          <a
            href="https://github.com/garvshaw89-glitch"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="external"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/15 hover:border-cyan-400 hover:text-cyan-300 text-slate-300 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer w-fit"
          >
            <span>@garvshaw89-glitch</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Real Metrics Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="p-4 sm:p-5 rounded-2xl bg-[#070D18]/80 border border-white/10">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block mb-1">
              PUBLIC REPOSITORIES
            </span>
            <span className="font-display font-black text-2xl sm:text-3xl text-white">
              {user ? user.public_repos : '18+'}
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#070D18]/80 border border-white/10">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block mb-1">
              FLAGSHIP SYSTEMS
            </span>
            <span className="font-display font-black text-2xl sm:text-3xl text-cyan-400">
              05
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#070D18]/80 border border-white/10">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block mb-1">
              AI EXPERIMENTS
            </span>
            <span className="font-display font-black text-2xl sm:text-3xl text-sky-400">
              03 LIVE
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-[#070D18]/80 border border-white/10">
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block mb-1">
              PRIMARY CODEBASE
            </span>
            <span className="font-display font-black text-2xl sm:text-3xl text-emerald-400">
              TypeScript
            </span>
          </div>
        </div>

        {/* Repositories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            // Skeleton Loaders
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-[#070D18]/80 border border-white/10 animate-pulse space-y-3"
              >
                <div className="h-5 bg-white/10 rounded w-1/3" />
                <div className="h-4 bg-white/5 rounded w-full" />
                <div className="h-4 bg-white/5 rounded w-2/3" />
              </div>
            ))
          ) : repos.length > 0 && !isRateLimited ? (
            repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="external"
                className="p-6 rounded-2xl bg-[#070D18]/85 border border-white/10 hover:border-cyan-500/40 hover:bg-[#0c1322] transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm sm:text-base text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      {repo.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 mb-4">
                    {repo.description || 'Public repository by Garv Shaw.'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-3 border-t border-white/5">
                  {repo.language && (
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {repo.language}
                    </span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {repo.stargazers_count}
                    </span>
                  )}
                  {repo.forks_count > 0 && (
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5" />
                      {repo.forks_count}
                    </span>
                  )}
                </div>
              </a>
            ))
          ) : (
            // Fallback verified repos
            fallbackRepos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="external"
                className="p-6 rounded-2xl bg-[#070D18]/85 border border-white/10 hover:border-cyan-500/40 hover:bg-[#0c1322] transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm sm:text-base text-white group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      {repo.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <p className="font-sans text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {repo.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs font-mono text-slate-400">
                  <span className="text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" /> {repo.language}
                  </span>
                  <span className="text-slate-400">Public Repository</span>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
