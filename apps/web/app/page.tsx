'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [status, setStatus] = useState('아직 연결을 확인하지 않았어요.');
  const [checking, setChecking] = useState(false);

  async function checkConnection() {
    setChecking(true);
    setStatus('연결을 확인하고 있어요.');
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('연결 확인 실패');
      const result = await response.json();
      setStatus(
        result.status === 'ok' && result.database === 'up'
          ? '서버와 데이터베이스가 정상적으로 연결됐어요.'
          : '서버 또는 데이터베이스 상태를 확인해 주세요.',
      );
    } catch {
      setStatus(
        '연결할 수 없어요. 서버와 데이터베이스가 실행 중인지 확인해 주세요.',
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <main>
      <p className="eyebrow">STUDY ROOM</p>
      <h1>스터디룸 예약</h1>
      <p className="description">함께 공부할 공간을 위한 첫걸음.</p>
      <Link className="home-link" href="/login">
        로그인 →
      </Link>
      <section aria-labelledby="connection-title">
        <h2 id="connection-title">서비스 연결 확인</h2>
        <p role="status">{status}</p>
        <button type="button" disabled={checking} onClick={checkConnection}>
          {checking ? '확인 중…' : '연결 확인'}
        </button>
      </section>
    </main>
  );
}
