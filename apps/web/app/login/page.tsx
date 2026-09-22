'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';

export default function LoginPage() {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    submitting.current = true;
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(data.get('email')).trim(),
          password: String(data.get('password')),
        }),
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? '이메일 또는 비밀번호가 올바르지 않아요.'
            : response.status === 400
              ? '이메일과 비밀번호를 확인해 주세요.'
              : '로그인할 수 없어요. 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
      const result = await response.json();
      if (typeof result.user?.email !== 'string' || !result.accessToken) {
        throw new Error('Invalid login response');
      }
      form.reset();
      setEmail(result.user.email);
    } catch {
      setError('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="login-page">
      <Link className="brand-link" href="/">
        STUDY ROOM
      </Link>
      <section className="login-card" aria-labelledby="login-title">
        <p className="eyebrow">WELCOME BACK</p>
        <h1 id="login-title">{email ? '반가워요!' : '다시 만나 반가워요'}</h1>
        {email ? (
          <div role="status">
            <p className="description">
              <strong>{email}</strong> 계정으로 로그인했어요.
            </p>
            <Link className="home-link" href="/">
              홈으로 돌아가기 →
            </Link>
          </div>
        ) : (
          <>
            <p className="description">
              로그인하고 함께 공부할 공간을 찾아보세요.
            </p>
            <form onSubmit={login} aria-busy={pending}>
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                required
                disabled={pending}
              />
              <label htmlFor="password">비밀번호</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력해 주세요"
                  required
                  disabled={pending}
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={
                    showPassword ? '비밀번호 숨기기' : '비밀번호 표시'
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
              {error && (
                <p className="login-error" role="alert">
                  {error}
                </p>
              )}
              <button className="login-submit" type="submit" disabled={pending}>
                {pending ? '로그인 중…' : '로그인'}
              </button>
            </form>
          </>
        )}
      </section>
      <p className="login-footer">집중하는 시간, 함께하는 공간.</p>
    </main>
  );
}
