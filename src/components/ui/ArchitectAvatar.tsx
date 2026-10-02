import React, { useState } from 'react';

interface ArchitectAvatarProps {
  size?: number;
  interactive?: boolean;
}

export const ArchitectAvatar: React.FC<ArchitectAvatarProps> = ({
  size = 80,
  interactive = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = 'https://github.com/garvshaw89-glitch.png';

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-2xl overflow-hidden bg-[#11151A] border border-white/[0.12] shadow-xl flex items-center justify-center ${
        interactive ? 'group cursor-pointer transition-transform duration-300 hover:scale-105' : ''
      }`}
    >
      {!imageError ? (
        <img
          src={avatarUrl}
          alt="Garv Shaw"
          className="w-full h-full object-cover rounded-2xl transition-all duration-500 group-hover:contrast-110"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#171C22] to-[#0B0E12] text-[#F2F3F5] font-mono">
          <span className="text-xl font-bold tracking-wider">GS</span>
          <span className="text-[9px] text-[#7EA7FF]">ARCHITECT</span>
        </div>
      )}

      {/* Subtle telemetry scanning lines overlay */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl bg-gradient-to-b from-transparent via-white/[0.03] to-transparent opacity-60" />
      <div className="absolute inset-0 pointer-events-none rounded-2xl border border-white/[0.08]" />
    </div>
  );
};
