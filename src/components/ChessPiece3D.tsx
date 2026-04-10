'use client';

interface ChessPiece3DProps {
  type: 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
  color: 'w' | 'b';
  size?: number;
}

export default function ChessPiece3D({ type, color, size = 48 }: ChessPiece3DProps) {
  const isWhite = color === 'w';

  // 색상 팔레트
  const fill = isWhite ? '#f5f0e8' : '#3a3a3a';
  const fillLight = isWhite ? '#fffdf7' : '#555555';
  const fillDark = isWhite ? '#d4cfc4' : '#1a1a1a';
  const fillMid = isWhite ? '#e8e2d6' : '#2e2e2e';
  const stroke = isWhite ? '#8a7e6b' : '#111111';
  const strokeLight = isWhite ? '#b8ad99' : '#444444';
  const highlight = isWhite ? '#ffffff' : '#777777';
  const shadow = isWhite ? '#c2b8a4' : '#0a0a0a';
  const accent = isWhite ? '#d4a843' : '#8b6914';
  const accentLight = isWhite ? '#f0d060' : '#c49a20';

  const gradId = `grad-${type}-${color}`;
  const shineId = `shine-${type}-${color}`;
  const shadowId = `shadow-${type}-${color}`;

  const baseGradient = (
    <>
      <defs>
        <linearGradient id={gradId} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={fillLight} />
          <stop offset="40%" stopColor={fill} />
          <stop offset="100%" stopColor={fillDark} />
        </linearGradient>
        <radialGradient id={shineId} cx="0.35" cy="0.25" r="0.5">
          <stop offset="0%" stopColor={highlight} stopOpacity="0.6" />
          <stop offset="100%" stopColor={highlight} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={shadowId} cx="0.5" cy="1" r="0.6">
          <stop offset="0%" stopColor={shadow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={shadow} stopOpacity="0" />
        </radialGradient>
      </defs>
    </>
  );

  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    xmlns: 'http://www.w3.org/2000/svg',
    style: { filter: `drop-shadow(1px 2px 2px rgba(0,0,0,${isWhite ? '0.3' : '0.5'}))` } as React.CSSProperties,
  };

  switch (type) {
    // 킹 - 십자가 + 왕관
    case 'k':
      return (
        <svg {...svgProps}>
          {baseGradient}
          {/* 받침대 */}
          <ellipse cx="24" cy="43" rx="14" ry="3" fill={shadow} opacity="0.3" />
          <ellipse cx="24" cy="41" rx="13" ry="3.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          <rect x="11" y="38" width="26" height="3.5" rx="1" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 몸통 */}
          <path d="M15 38 L17 26 Q24 22 31 26 L33 38 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 허리 장식 */}
          <path d="M17 32 Q24 29 31 32" fill="none" stroke={strokeLight} strokeWidth="0.8" />
          {/* 머리 */}
          <circle cx="24" cy="19" r="5.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 십자가 */}
          <rect x="22.5" y="6" width="3" height="11" rx="1" fill={accent} stroke={stroke} strokeWidth="0.8" />
          <rect x="19" y="9" width="10" height="3" rx="1" fill={accent} stroke={stroke} strokeWidth="0.8" />
          {/* 십자가 보석 */}
          <circle cx="24" cy="10.5" r="1.2" fill={accentLight} />
          {/* 하이라이트 */}
          <ellipse cx="21" cy="17" rx="2" ry="2.5" fill={`url(#${shineId})`} />
          <path d="M18 35 L19.5 28 Q24 25 28.5 28 L30 35" fill={`url(#${shineId})`} opacity="0.3" />
        </svg>
      );

    // 퀸 - 왕관 + 보석
    case 'q':
      return (
        <svg {...svgProps}>
          {baseGradient}
          {/* 받침대 */}
          <ellipse cx="24" cy="43" rx="14" ry="3" fill={shadow} opacity="0.3" />
          <ellipse cx="24" cy="41" rx="13" ry="3.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          <rect x="11" y="38" width="26" height="3.5" rx="1" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 몸통 */}
          <path d="M15 38 L17 25 Q24 21 31 25 L33 38 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 허리 장식 */}
          <path d="M17 31 Q24 28 31 31" fill="none" stroke={strokeLight} strokeWidth="0.8" />
          {/* 왕관 */}
          <path d="M14 22 L17 14 L20 19 L24 10 L28 19 L31 14 L34 22 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" strokeLinejoin="round" />
          {/* 왕관 띠 */}
          <path d="M15 22 Q24 19 33 22" fill="none" stroke={accent} strokeWidth="1.5" />
          {/* 보석들 */}
          <circle cx="17" cy="14" r="1.5" fill={accentLight} stroke={accent} strokeWidth="0.5" />
          <circle cx="24" cy="10" r="2" fill={accentLight} stroke={accent} strokeWidth="0.5" />
          <circle cx="31" cy="14" r="1.5" fill={accentLight} stroke={accent} strokeWidth="0.5" />
          {/* 중앙 보석 */}
          <circle cx="24" cy="22" r="1.5" fill="#e04050" stroke={stroke} strokeWidth="0.5" />
          {/* 하이라이트 */}
          <path d="M17 36 L19 27 Q24 24 29 27 L31 36" fill={`url(#${shineId})`} opacity="0.3" />
        </svg>
      );

    // 룩(성) - 성곽 탑
    case 'r':
      return (
        <svg {...svgProps}>
          {baseGradient}
          {/* 받침대 */}
          <ellipse cx="24" cy="43" rx="13" ry="3" fill={shadow} opacity="0.3" />
          <rect x="12" y="38" width="24" height="4" rx="1.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 몸통 */}
          <path d="M14 38 L16 21 L32 21 L34 38 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 성벽 상단 */}
          <rect x="14" y="17" width="20" height="4.5" rx="0.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 성곽 이빨 */}
          <rect x="14" y="11" width="4.5" height="7" rx="0.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          <rect x="21.75" y="11" width="4.5" height="7" rx="0.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          <rect x="29.5" y="11" width="4.5" height="7" rx="0.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 문 */}
          <path d="M21 38 L21 30 Q24 27 27 30 L27 38 Z" fill={fillDark} stroke={stroke} strokeWidth="0.8" />
          {/* 가로줄 장식 */}
          <line x1="16" y1="28" x2="21" y2="28" stroke={strokeLight} strokeWidth="0.7" />
          <line x1="27" y1="28" x2="32" y2="28" stroke={strokeLight} strokeWidth="0.7" />
          <line x1="16" y1="33" x2="21" y2="33" stroke={strokeLight} strokeWidth="0.7" />
          <line x1="27" y1="33" x2="32" y2="33" stroke={strokeLight} strokeWidth="0.7" />
          {/* 하이라이트 */}
          <rect x="16" y="12" width="2" height="5" rx="0.5" fill={highlight} opacity="0.3" />
          <rect x="23.5" y="12" width="2" height="5" rx="0.5" fill={highlight} opacity="0.3" />
          <path d="M17 36 L18.5 22 L23 22 L23 38" fill={`url(#${shineId})`} opacity="0.2" />
        </svg>
      );

    // 비숍 - 뾰족한 모자(미트라)
    case 'b':
      return (
        <svg {...svgProps}>
          {baseGradient}
          {/* 받침대 */}
          <ellipse cx="24" cy="43" rx="12" ry="3" fill={shadow} opacity="0.3" />
          <ellipse cx="24" cy="41" rx="12" ry="3" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          <rect x="13" y="38" width="22" height="3.5" rx="1" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 몸통 */}
          <path d="M16 38 L18 28 Q24 24 30 28 L32 38 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 미트라(모자) */}
          <path d="M18 28 Q18 18 24 8 Q30 18 30 28 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 대각선 슬릿 */}
          <path d="M21 24 L26 14" fill="none" stroke={fillDark} strokeWidth="1.5" strokeLinecap="round" />
          {/* 꼭대기 구슬 */}
          <circle cx="24" cy="8" r="2.2" fill={accent} stroke={stroke} strokeWidth="0.8" />
          <circle cx="23.2" cy="7.2" r="0.7" fill={accentLight} opacity="0.8" />
          {/* 목 장식 */}
          <ellipse cx="24" cy="28" rx="7" ry="2" fill={fillMid} stroke={strokeLight} strokeWidth="0.8" />
          {/* 하이라이트 */}
          <path d="M20 26 Q20 19 24 10 Q22 18 21 26 Z" fill={highlight} opacity="0.25" />
          <path d="M19 36 L20 30 Q24 27 28 30 L29 36" fill={`url(#${shineId})`} opacity="0.2" />
        </svg>
      );

    // 나이트 - 클래식 체스 말
    case 'n': {
      const maneColor = isWhite ? '#c2b59b' : '#151515';
      const maneStroke = isWhite ? '#a89878' : '#000000';
      return (
        <svg {...svgProps}>
          {baseGradient}
          <defs>
            <linearGradient id={`${gradId}-face`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={fillLight} />
              <stop offset="100%" stopColor={fillMid} />
            </linearGradient>
          </defs>
          {/* 받침대 그림자 */}
          <ellipse cx="24" cy="44" rx="14" ry="2.5" fill={shadow} opacity="0.3" />
          {/* 받침대 */}
          <path d="M10 39 Q10 42 24 43 Q38 42 38 39 L36 37 Q24 38 12 37 Z"
            fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1" />
          <path d="M12 37 Q24 38.5 36 37 Q36 35 24 36 Q12 35 12 37 Z"
            fill={fillLight} stroke={stroke} strokeWidth="0.8" />

          {/* 말 머리+목 메인 실루엣 (클래식 Staunton 스타일) */}
          <path d={[
            'M16 36',
            'C15 32 13 28 13 24',   // 목 뒤쪽 (S자 커브)
            'C13 20 15 16 17 13',   // 뒷머리
            'C18 11 19 9 21 7',     // 정수리
            'C22 6 24 5.5 25 6',    // 이마 꼭대기
            'C27 7 29 9 31 12',     // 이마 → 코 연결
            'C33 15 35 18 36 22',   // 코 (앞으로 쭉)
            'C36.5 24 36 26 34 27', // 코끝 (둥글게)
            'C32 28 31 28 30 27',   // 윗입술
            'C29 26 29 25 30 24',   // 입 안쪽 커브
            'C30 27 31 30 32 33',   // 턱~목 앞쪽
            'C33 35 33 36 33 36',   // 목 아래
            'L33 36',
            'Z',
          ].join(' ')}
            fill={`url(#${gradId}-face)`} stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" />

          {/* 갈기 (뒷머리에서 목까지 흐르는 곡선) */}
          <path d="M17 13 C16 11 18 8 21 7"
            fill="none" stroke={maneStroke} strokeWidth="2.5" strokeLinecap="round" />
          <path d={[
            'M17 13',
            'C14 14 12 16 13 19',
            'C14 17 15 15 17 14',
            'C15 16 13 19 13 22',
            'C14 20 15 18 16 17',
            'C14 20 13 23 13 26',
            'C14 24 15 21 16 20',
            'C14 24 14 27 14 30',
            'C15 28 15 25 16 23',
          ].join(' ')}
            fill="none" stroke={maneStroke} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
          {/* 갈기 볼륨 (뒤쪽에 두꺼운 레이어) */}
          <path d="M17 13 C15 15 13 20 13 26 C13.5 20 15 16 17 14 Z"
            fill={maneColor} opacity="0.5" />

          {/* 귀 */}
          <path d="M20 8 L18 4 Q19 3 21 5 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="0.9" />
          <path d="M19.5 6 L19 4.5" fill="none" stroke={fillDark} strokeWidth="0.5" />

          {/* 눈 (크고 생동감 있게) */}
          <ellipse cx="27" cy="14" rx="2.5" ry="2.8" fill={isWhite ? '#fff' : '#4a4a4a'} stroke={stroke} strokeWidth="1" />
          <ellipse cx="27.5" cy="14.2" rx="1.5" ry="1.7" fill={isWhite ? '#2a1510' : '#111'} />
          <circle cx="28.2" cy="13.5" r="0.6" fill="#fff" opacity="0.9" />
          {/* 눈썹 라인 */}
          <path d="M24.5 11.5 Q27 10.5 29.5 11.5" fill="none" stroke={stroke} strokeWidth="0.6" />

          {/* 콧구멍 (둥글고 뚜렷하게) */}
          <ellipse cx="34.5" cy="25" rx="1.2" ry="1" fill={fillDark} stroke={stroke} strokeWidth="0.5" />

          {/* 입 라인 */}
          <path d="M34 27 C33 27.5 31 27.5 30 27" fill="none" stroke={stroke} strokeWidth="0.8" />

          {/* 볼 하이라이트 */}
          <path d="M25 11 C28 10 31 12 33 16 C30 13 27 11 25 11 Z"
            fill={highlight} opacity="0.3" />
          {/* 목 하이라이트 */}
          <path d="M19 34 C18 28 17 24 18 18 L21 18 C20 24 20 28 22 34 Z"
            fill={highlight} opacity="0.12" />
          {/* 코 하이라이트 */}
          <path d="M31 13 C33 16 35 20 35.5 23 C34.5 20 33 16 31 14 Z"
            fill={highlight} opacity="0.2" />
        </svg>
      );
    }

    // 폰 - 단순한 둥근 머리
    case 'p':
      return (
        <svg {...svgProps}>
          {baseGradient}
          {/* 받침대 */}
          <ellipse cx="24" cy="43" rx="11" ry="3" fill={shadow} opacity="0.3" />
          <ellipse cx="24" cy="41" rx="11" ry="3" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          <rect x="14" y="38" width="20" height="3.5" rx="1" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 몸통 */}
          <path d="M17 38 L19 30 Q24 27 29 30 L31 38 Z" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 목 */}
          <rect x="20" y="24" width="8" height="6" rx="3" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 머리 */}
          <circle cx="24" cy="18" r="6.5" fill={`url(#${gradId})`} stroke={stroke} strokeWidth="1.2" />
          {/* 하이라이트 */}
          <ellipse cx="21.5" cy="15.5" rx="3" ry="3.5" fill={`url(#${shineId})`} />
          <path d="M20 36 L21 31 Q24 29 27 31 L28 36" fill={`url(#${shineId})`} opacity="0.2" />
        </svg>
      );

    default:
      return null;
  }
}
