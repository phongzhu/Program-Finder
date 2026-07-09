import { joinClassNames } from 'Utils/ui';

export function AuthInlineLink({ className, label, onClick }) {
  return (
    <div className={joinClassNames('pf-auth-inline-link-row', className)}>
      <button className="pf-auth-inline-link" onClick={onClick} type="button">
        {label}
      </button>
    </div>
  );
}

export function AuthPrompt({ className, context, label, onClick }) {
  return (
    <div className={joinClassNames('pf-auth-prompt', className)}>
      <div className="pf-auth-prompt-row">
        {context ? <span className="pf-auth-prompt-context">{context}</span> : null}
        <button className="pf-auth-prompt-link" onClick={onClick} type="button">
          {label}
        </button>
      </div>
    </div>
  );
}

export function AuthFooterLink({ children, className, ...props }) {
  return (
    <button className={joinClassNames('pf-auth-footer-link', className)} type="button" {...props}>
      {children}
    </button>
  );
}
