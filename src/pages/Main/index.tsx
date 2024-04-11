import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '~/components';
import { QUERY } from '~/lib/queries';
import { UserInfo } from './UserInfo';
import { LoginModal } from './LoginModal';
import { LogoutModal } from './LogoutModal';

export function MainPage() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { data: currentUser } = useQuery(QUERY.CURRENT_USER);
  const navigate = useNavigate();

  const onClickStart = () =>
    currentUser ? navigate('/rooms') : setShowLoginModal(true);

  const onLogout = () => {
    // 로그아웃 로직
    setShowLogoutModal(false);
  };

  return (
    <main className="flex grow flex-col items-center justify-center gap-12">
      {showLoginModal && (
        <LoginModal closeModal={() => setShowLoginModal(false)} />
      )}
      {showLogoutModal && (
        <LogoutModal
          onLogout={onLogout}
          closeModal={() => setShowLogoutModal(false)}
        />
      )}
      {currentUser && (
        <UserInfo
          user={currentUser}
          onShowLogoutModal={() => setShowLogoutModal(true)}
        />
      )}
      <div className="flex flex-col items-center gap-2">
        <h1 className="font-title text-4xl">Nine Men&apos;s Morris</h1>
        <h2 className="text-xl font-light tracking-[0.75rem] text-gray-500">
          나인 멘스 모리스
        </h2>
      </div>
      <div className="flex w-60 flex-col gap-4">
        <Button text="게임 시작" onClick={onClickStart} />
        <Link to="/ranking" className="flex w-full flex-col">
          <Button theme="secondary" text="랭킹 보기" onClick={() => {}} />
        </Link>
      </div>
    </main>
  );
}
