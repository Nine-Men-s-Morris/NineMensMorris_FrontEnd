import { Button, Modal } from '~/components';

type LogoutModalProps = {
  isShowing: boolean;
  onLogout: () => void;
  closeModal: () => void;
};

export function LogoutModal({
  isShowing,
  onLogout,
  closeModal,
}: LogoutModalProps) {
  return (
    <Modal isShowing={isShowing}>
      <>
        <div className="font-semibold">로그아웃할까요?</div>
        <div className="flex w-full gap-4">
          <Button
            theme="secondary"
            text="취소"
            onClick={closeModal}
            fullWidth
          />
          <Button text="로그아웃" onClick={onLogout} fullWidth />
        </div>
      </>
    </Modal>
  );
}
