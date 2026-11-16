import React, { useState, useEffect } from 'react';
import { Github, BookOpen, ExternalLink, GitBranch, Code2 } from 'lucide-react';
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

export const GitHubSection: React.FC<GitHubSectionProps> = ({
  inSheet = false,
  id = 'github-telemetry',
}) => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchGitHubData() {
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
      } catch {
        if (isMounted) setIsRateLimited(true);
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

  const displayedRepos = repos.length > 0 && !isRateLimited ? repos : fallbackRepos;

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
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
          className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-[#070A10]/92 hover:bg-[#0B101A] border border-white/[0.12] hover:border-sky-400/50 transition-all duration-300 shadow-[0_14px_40px_rgba(0,0,0,0.75)] group w-fit"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/90 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            REPOSITORIES
          </span>
          <span className="font-editorial text-3xl sm:text-4xl font-bold text-[#F2F3F5] tabular-nums">
            {user ? user.public_repos : '18+'}
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/90 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            FLAGSHIPS
          </span>
          <span className="font-editorial text-3xl sm:text-4xl font-bold text-sky-400 tabular-nums">
            05
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/90 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            PRIMARY STACK
          </span>
          <span className="font-editorial text-2xl sm:text-3xl font-bold text-[#F2F3F5]">
            TypeScript
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#070A10]/90 border border-white/[0.09] shadow-[0_14px_40px_rgba(0,0,0,0.7)]">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#626A73] block mb-1.5">
            ARCHITECTURE
          </span>
          <span className="font-editorial text-xl sm:text-2xl font-bold text-indigo-300 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-sky-400 shrink-0" />
            AI · Cloud
          </span>
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {displayedRepos.map((repo, i) => (
          <a
            key={i}
            href={'html_url' in repo ? repo.html_url : repo.url}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor="link"
            data-cursor-label="REPO"
            className="p-6 sm:p-7 rounded-2xl bg-[#070A10]/90 border border-white/[0.09] hover:border-sky-400/45 hover:bg-[#0B1018] transition-all duration-300 group flex flex-col justify-between shadow-[0_18px_50px_rgba(0,0,0,0.7)]"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-editorial text-lg sm:text-xl font-bold text-[#F2F3F5] group-hover:text-sky-300 transition-colors flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{repo.name}</span>
                </span>
                <ExternalLink className="w-4 h-4 text-[#626A73] group-hover:text-sky-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </div>
              <p className="font-sans text-sm text-[#A7ADB5] font-light leading-relaxed mb-5">
                {repo.description || 'Public software repository by Garv Shaw.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3.5 border-t border-white/[0.06] font-mono text-xs text-[#626A73]">
              <span className="flex items-center gap-1.5 text-sky-300">
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                {repo.language || 'TypeScript'}
              </span>
              <span className="uppercase tracking-wider">PUBLIC REPOSITORY</span>
            </div>
          </a>
        ))}
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
