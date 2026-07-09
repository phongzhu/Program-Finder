const STAGE_VECTORS = {
  overview: {
    mainPaths: [
      {
        d: 'M74 404C170 350 276 326 386 340C508 356 574 430 694 430C806 430 900 356 1020 330C1090 314 1140 322 1182 342',
        strokeWidth: 3,
        strokeDasharray: '12 16',
      },
      {
        d: 'M742 98C800 132 854 180 898 250C944 322 998 388 1110 424',
        strokeWidth: 2,
      },
    ],
    accentPaths: [
      {
        d: 'M120 150C224 126 330 136 420 184C506 230 574 318 690 334',
        strokeWidth: 2.4,
        strokeDasharray: '8 12',
      },
    ],
  },
  programs: {
    mainPaths: [
      {
        d: 'M48 282C146 256 248 248 338 276C450 312 542 398 664 398C804 398 888 274 1018 248C1090 232 1148 240 1194 264',
        strokeWidth: 3,
        strokeDasharray: '10 16',
      },
    ],
    accentPaths: [
      {
        d: 'M790 80C730 130 702 194 702 258C702 328 734 386 810 426',
        strokeWidth: 2,
      },
      {
        d: 'M148 124C246 96 352 102 442 152',
        strokeWidth: 2.2,
      },
    ],
  },
  howItWorks: {
    mainPaths: [
      {
        d: 'M70 430C164 376 260 346 346 318C438 288 504 246 586 198C668 150 754 114 860 116C968 118 1060 170 1168 244',
        strokeWidth: 3,
        strokeDasharray: '12 14',
      },
    ],
    accentPaths: [
      {
        d: 'M182 170H402C468 170 526 224 526 290V352',
        strokeWidth: 2.2,
      },
      {
        d: 'M664 102C724 132 770 184 794 248',
        strokeWidth: 2,
      },
    ],
  },
  features: {
    mainPaths: [
      {
        d: 'M86 384C178 316 268 288 380 296C494 304 566 366 688 366C816 366 898 268 1008 248C1070 236 1122 250 1180 286',
        strokeWidth: 3,
        strokeDasharray: '12 16',
      },
    ],
    accentPaths: [
      {
        d: 'M198 126C310 110 420 132 516 188',
        strokeWidth: 2.2,
      },
      {
        d: 'M894 114C840 148 798 202 776 272',
        strokeWidth: 2,
      },
    ],
  },
  categories: {
    mainPaths: [
      {
        d: 'M64 294C178 224 270 188 388 188C514 188 610 244 724 288C834 330 938 350 1086 326',
        strokeWidth: 3,
        strokeDasharray: '10 14',
      },
    ],
    accentPaths: [
      {
        d: 'M204 114C294 162 362 240 418 334',
        strokeWidth: 2.1,
      },
      {
        d: 'M798 110C886 150 954 206 1010 286',
        strokeWidth: 2.1,
      },
    ],
  },
  announcements: {
    mainPaths: [
      {
        d: 'M46 340C132 294 224 274 320 280C446 288 550 378 670 378C810 378 894 274 1012 248C1084 232 1142 242 1194 270',
        strokeWidth: 3,
        strokeDasharray: '12 16',
      },
    ],
    accentPaths: [
      {
        d: 'M184 126C292 120 392 154 482 222',
        strokeWidth: 2.2,
      },
      {
        d: 'M912 104C860 160 826 226 806 300',
        strokeWidth: 2,
      },
    ],
  },
  faq: {
    mainPaths: [
      {
        d: 'M72 380C156 326 244 294 346 292C474 290 582 352 704 352C824 352 912 274 1030 248C1096 234 1144 240 1182 262',
        strokeWidth: 3,
        strokeDasharray: '10 14',
      },
    ],
    accentPaths: [
      {
        d: 'M210 116C306 142 398 198 466 280',
        strokeWidth: 2.2,
      },
      {
        d: 'M776 108C866 146 948 210 1004 296',
        strokeWidth: 2.2,
      },
    ],
  },
  contact: {
    mainPaths: [
      {
        d: 'M60 298C166 248 258 228 362 244C482 264 564 358 680 358C812 358 894 258 1008 232C1082 214 1144 224 1194 254',
        strokeWidth: 3,
        strokeDasharray: '12 16',
      },
    ],
    accentPaths: [
      {
        d: 'M162 126C258 118 352 140 434 188',
        strokeWidth: 2.2,
      },
      {
        d: 'M904 90C852 134 814 198 786 284',
        strokeWidth: 2.2,
      },
    ],
  },
  cta: {
    mainPaths: [
      {
        d: 'M52 348C152 290 248 264 356 274C468 286 562 372 686 372C820 372 912 266 1038 238C1104 224 1158 232 1194 252',
        strokeWidth: 3,
        strokeDasharray: '12 16',
      },
    ],
    accentPaths: [
      {
        d: 'M162 134C278 120 380 160 474 234',
        strokeWidth: 2.4,
      },
      {
        d: 'M856 114C938 154 1000 212 1054 292',
        strokeWidth: 2.2,
      },
    ],
  },
  footer: {
    mainPaths: [
      {
        d: 'M38 308C150 244 252 222 370 238C500 256 582 348 708 348C842 348 924 248 1044 224C1104 212 1154 220 1198 246',
        strokeWidth: 3,
        strokeDasharray: '12 14',
      },
    ],
    accentPaths: [
      {
        d: 'M174 126C282 112 388 142 480 206',
        strokeWidth: 2.2,
      },
      {
        d: 'M886 92C832 140 786 210 748 304',
        strokeWidth: 2.2,
      },
    ],
  },
};

export function PublicStageBackdrop({ variant }) {
  const vectorConfig = STAGE_VECTORS[variant];

  if (!vectorConfig) {
    return null;
  }

  return (
    <div className={`pf-stage-backdrop pf-stage-backdrop-${variant}`} aria-hidden="true">
      <div className="pf-stage-glow pf-stage-glow-one" />
      <div className="pf-stage-glow pf-stage-glow-two" />

      <div className="pf-stage-bubbles">
        <span className="pf-stage-bubble pf-stage-bubble-one" />
        <span className="pf-stage-bubble pf-stage-bubble-two" />
        <span className="pf-stage-bubble pf-stage-bubble-three" />
        <span className="pf-stage-bubble pf-stage-bubble-four" />
        <span className="pf-stage-bubble pf-stage-bubble-five" />
      </div>

      <svg
        aria-hidden="true"
        className="pf-stage-vector pf-stage-vector-main"
        fill="none"
        viewBox="0 0 1200 520"
      >
        {vectorConfig.mainPaths.map((path) => (
          <path
            d={path.d}
            key={path.d}
            opacity={path.opacity ?? 1}
            stroke="currentColor"
            strokeDasharray={path.strokeDasharray}
            strokeLinecap="round"
            strokeWidth={path.strokeWidth}
          />
        ))}
      </svg>

      <svg
        aria-hidden="true"
        className="pf-stage-vector pf-stage-vector-secondary"
        fill="none"
        viewBox="0 0 1200 520"
      >
        {vectorConfig.accentPaths.map((path) => (
          <path
            d={path.d}
            key={path.d}
            opacity={path.opacity ?? 1}
            stroke="currentColor"
            strokeDasharray={path.strokeDasharray}
            strokeLinecap="round"
            strokeWidth={path.strokeWidth}
          />
        ))}
      </svg>
    </div>
  );
}

export default PublicStageBackdrop;
