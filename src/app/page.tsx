'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('chess-player-name');
    if (saved) setName(saved);
  }, []);

  const saveName = () => {
    if (name.trim()) {
      localStorage.setItem('chess-player-name', name.trim());
      setShowNameInput(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="game-card w-full max-w-md text-center space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            &#9823; 은우의 체스
          </h1>
          <p className="text-gray-500 text-sm">
            AI와 대결하거나 친구와 함께 플레이하세요!
          </p>
        </div>

        {/* Player name */}
        {showNameInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              placeholder="이름을 입력하세요"
              className="flex-1 px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none text-center font-semibold"
              autoFocus
            />
            <button onClick={saveName} className="btn-primary px-4 py-2 text-sm">
              확인
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNameInput(true)}
            className="text-purple-600 font-semibold hover:text-purple-800 transition-colors"
          >
            {name ? `${name} 님` : '이름 설정하기'}
          </button>
        )}

        {/* Menu buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/play')}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">&#129302;</span>
            혼자 연습하기
          </button>

          <button
            onClick={() => router.push('/local')}
            className="btn-secondary w-full py-4 text-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">&#129309;</span>
            친구와 대결
          </button>
        </div>

        {/* Rules */}
        <details className="text-left">
          <summary className="cursor-pointer text-purple-600 font-semibold text-sm hover:text-purple-800">
            &#128214; 체스 규칙 보기
          </summary>
          <div className="mt-3 p-4 bg-purple-50 rounded-xl text-sm text-gray-700 space-y-2">
            <p><strong>목표:</strong> 상대 킹을 체크메이트하세요.</p>
            <p><strong>기물 이동:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>킹(&#9812;): 모든 방향 1칸</li>
              <li>퀸(&#9813;): 모든 방향 무제한</li>
              <li>룩(&#9814;): 직선 무제한</li>
              <li>비숍(&#9815;): 대각선 무제한</li>
              <li>나이트(&#9816;): L자 이동</li>
              <li>폰(&#9817;): 앞으로 1칸 (첫 이동시 2칸), 대각선으로 잡기</li>
            </ul>
            <p><strong>특수 규칙:</strong> 캐슬링, 앙파상, 프로모션</p>
          </div>
        </details>
      </div>
    </main>
  );
}
