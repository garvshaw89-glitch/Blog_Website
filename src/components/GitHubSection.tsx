import React, { useState, useEffect } from 'react';
import { Github, Star, GitFork, BookOpen, ExternalLink, Activity } from 'lucide-react';

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

  const fallbackRepos = [
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
      description: 'Real-time keystroke velocity analytics engine and error heatmap.',
      url: 'https://github.com/garvshaw89-glitch/Typing-Speed-Checker-',
      language: 'JavaScript',
    },
  ];

  return (
    <section
      id={id}
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 md:px-12 bg-transparent select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-16">
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-semibold text-xs">05 //</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              OPEN SOURCE &amp; CODE ACTIVITY
            </span>
          </div>
          <span className="font-mono text-xs text-neutral-400">GITHUB TELEMETRY</span>
        </div>

        {/* Section Title & Profile Meta */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <h2 className="font-editorial text-4xl sm:text-6xl font-bold uppercase tracking-tight text-white mb-3">
              ENGINEERING.
            </h2>
            <p className="font-sans text-neutral-400 text-sm sm:text-base leading-relaxed font-light max-w-xl">
              Verified public repositories and continuous development activity across artificial intelligence, microservices, and web utilities.
            </p>
          </div>

          <a
            href="https://github.com/garvshaw89-glitch"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            data-cursor-label="GITHUB"
            className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#08090B]/90 hover:bg-[#0c1018] border border-white/15 hover:border-cyan-400/50 transition-all duration-300 shadow-xl group w-fit"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-rose-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-shadow">
                <img
                  src="/github_avatar.png"
                  alt="Garv Shaw GitHub Avatar"
                  className="w-full h-full object-cover rounded-full bg-[#050505]"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border border-[#08090B]" />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-white group-hover:text-cyan-300 transition-colors">
                <Github className="w-3.5 h-3.5 text-cyan-400" />
                <span>@garvshaw89-glitch</span>
                <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                18+ Repositories • Active
              </span>
            </div>
          </a>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-2xl bg-[#08090B]/90 border border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              REPOSITORIES
            </span>
            <span className="font-editorial text-3xl sm:text-4xl font-bold text-white">
              {user ? user.public_repos : '18+'}
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#08090B]/90 border border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              FLAGSHIPS
            </span>
            <span className="font-editorial text-3xl sm:text-4xl font-bold text-cyan-400">
              05
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#08090B]/90 border border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              PRIMARY STACK
            </span>
            <span className="font-editorial text-2xl sm:text-3xl font-bold text-sky-400">
              TypeScript
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#08090B]/90 border border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-1">
              SYSTEM STATUS
            </span>
            <span className="font-editorial text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>

        {/* Repositories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(repos.length > 0 && !isRateLimited ? repos : fallbackRepos).map((repo, i) => (
            <a
              key={i}
              href={'html_url' in repo ? repo.html_url : repo.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="link"
              data-cursor-label="REPO"
              className="p-8 rounded-3xl bg-[#08090B]/90 border border-white/10 hover:border-cyan-400/40 hover:bg-[#0c0e12] transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-editorial text-xl font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    {repo.name}
                  </span>
                  <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <p className="font-sans text-sm text-neutral-300 font-light leading-relaxed mb-6">
                  {repo.description || 'Public software repository by Garv Shaw.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 font-mono text-xs text-neutral-400">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {repo.language || 'TypeScript'}
                </span>
                <span className="text-neutral-500">PUBLIC SYSTEM</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
