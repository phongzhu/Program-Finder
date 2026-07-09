export function AnnouncementVectorArt() {
  return (
    <div className="admin-announcements-art" aria-hidden="true">
      <span className="admin-announcements-art-pill pill-primary">Broadcast</span>
      <span className="admin-announcements-art-pill pill-secondary">Live</span>
      <span className="admin-announcements-orb orb-one" />
      <span className="admin-announcements-orb orb-two" />
      <span className="admin-announcements-orb orb-three" />
      <div className="admin-announcements-glass glass-one" />
      <div className="admin-announcements-glass glass-two" />

      <svg className="admin-announcements-svg admin-announcements-svg-wave" viewBox="0 0 360 240" preserveAspectRatio="none">
        <path
          d="M24 154C63 126 104 110 139 124C173 138 204 181 240 190C282 200 320 169 336 142"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M44 92C78 61 120 52 151 67C183 82 213 122 253 134C291 145 320 125 342 89"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="12 14"
          opacity="0.8"
        />
      </svg>

      <svg className="admin-announcements-svg admin-announcements-svg-grid" viewBox="0 0 220 220">
        <path
          d="M42 26v168M78 26v168M114 26v168M150 26v168M186 26v168M26 42h168M26 78h168M26 114h168M26 150h168M26 186h168"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.75"
        />
        <circle cx="110" cy="110" r="64" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="110" cy="110" r="20" fill="currentColor" opacity="0.15" />
      </svg>

      <svg className="admin-announcements-svg admin-announcements-svg-stars" viewBox="0 0 140 140">
        <polygon
          points="70 14 83 54 126 70 83 86 70 126 57 86 14 70 57 54"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="105" cy="35" r="6" fill="currentColor" opacity="0.88" />
        <circle cx="36" cy="104" r="4" fill="currentColor" opacity="0.78" />
      </svg>
    </div>
  );
}
