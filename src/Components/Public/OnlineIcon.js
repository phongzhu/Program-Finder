import { getOnlineIconUrl } from 'Services/Public/public-utils';

export function OnlineIcon({ icon, color, className }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={className}
      decoding="async"
      loading="lazy"
      src={getOnlineIconUrl(icon, color)}
    />
  );
}
