import { useState } from 'react';
import { Board } from './Board';
import { Status } from './Status';
import { WithdrawModal } from './WithdrawModal';

export function GamePage() {
  const [showModal, setShowModal] = useState(false);

  const onWithdraw = () => {
    setShowModal(true);
  };

  return (
    <main className="flex grow flex-col overflow-x-hidden p-8 md:gap-4">
      {showModal && <WithdrawModal closeModal={() => setShowModal(false)} />}
      <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
        <div className="bg-phase z-20 flex w-full justify-center gap-4 text-white md:flex-col md:gap-0 md:bg-none md:text-black">
          <h1 className="font-phase text-xl md:text-7xl">Phase 1</h1>
          <span className="text-lg font-semibold">돌 배치 단계</span>
        </div>
        <Status
          isCurrentUser={false}
          isTurn={false}
          color="BLACK"
          remaining={5}
        />
      </div>
      <Board />
      <div className="flex justify-center py-2 md:mt-8">
        빈 지점에 돌을 배치하세요.
      </div>
      <div className="flex -translate-x-3 justify-center md:translate-x-0 md:justify-start">
        <Status
          isCurrentUser={true}
          isTurn={true}
          color="WHITE"
          remaining={7}
          onWithdraw={onWithdraw}
        />
      </div>
    </main>
  );
}
