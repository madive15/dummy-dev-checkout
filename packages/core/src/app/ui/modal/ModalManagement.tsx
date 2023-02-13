import React from 'react';
import Modal from './Modal';
import ModalContents from './ModalContents';

interface ModalManagementProps {
  modal:boolean;
  closeModal():void;
}

const ModalManagement = ({modal,closeModal}:ModalManagementProps) => {
  return (
    <Modal isOpen={modal}>
      <ModalContents
        clickable={closeModal}
        modalText="代金引換でお支払いする際、440円の手数料が追加されます。"
      />
    </Modal>
  );
};

export default ModalManagement;