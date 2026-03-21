import React from "react";
import { Camera } from "lucide-react";

// Soft pastel colors for initials avatars
const AVATAR_COLORS = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#e879f9",
  "#818cf8",
  "#38bdf8",
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

interface UserAvatarProps {
  name?: string | null;
  avatarBase64?: string | null;
  photoURL?: string | null;
  size?: number;
  editable?: boolean;
  onEditClick?: () => void;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarBase64,
  photoURL,
  size = 40,
  editable = false,
  onEditClick,
  className = "",
}) => {
  const [imgError, setImgError] = React.useState(false);
  const [googleImgError, setGoogleImgError] = React.useState(false);

  // Reset error state when source changes
  React.useEffect(() => {
    setImgError(false);
  }, [avatarBase64]);
  React.useEffect(() => {
    setGoogleImgError(false);
  }, [photoURL]);

  const fontSize = Math.max(size * 0.38, 10);
  const iconSize = Math.max(size * 0.3, 12);

  const isExplicitlyRemoved = avatarBase64 === "removed";
  const hasCustomAvatar =
    avatarBase64 && avatarBase64 !== "removed" && !imgError;

  const validGooglePhoto =
    !isExplicitlyRemoved &&
    photoURL &&
    photoURL !== "undefined" &&
    photoURL !== "null" &&
    !googleImgError;

  // Priority 1: Custom avatar
  if (hasCustomAvatar) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={avatarBase64}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        {editable && (
          <EditOverlay size={size} iconSize={iconSize} onClick={onEditClick} />
        )}
      </div>
    );
  }

  // Priority 2: Google / provider photo
  if (validGooglePhoto) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={photoURL!}
          alt="Avatar"
          className="w-full h-full object-cover bg-slate-200 dark:bg-zinc-700"
          loading="lazy"
          onError={() => setGoogleImgError(true)}
        />
        {editable && (
          <EditOverlay size={size} iconSize={iconSize} onClick={onEditClick} />
        )}
      </div>
    );
  }

  // Priority 3: Initials avatar
  const displayName = name || "User";
  const bgColor = getColorFromName(displayName);
  const initials = getInitials(displayName);

  return (
    <div
      className={`relative rounded-full shrink-0 flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
      }}
    >
      <span className="font-bold text-white leading-none" style={{ fontSize }}>
        {initials}
      </span>
      {editable && (
        <EditOverlay size={size} iconSize={iconSize} onClick={onEditClick} />
      )}
    </div>
  );
};

// Edit overlay with camera icon
function EditOverlay({
  size,
  iconSize,
  onClick,
}: {
  size: number;
  iconSize: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-200 rounded-full flex items-center justify-center cursor-pointer group"
      style={{ width: size, height: size }}
      title="Change photo"
    >
      <Camera
        size={iconSize}
        className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg"
      />
    </button>
  );
}

export default UserAvatar;
