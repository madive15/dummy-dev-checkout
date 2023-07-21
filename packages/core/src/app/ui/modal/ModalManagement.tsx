import React from 'react';
import Modal from './Modal';
import ModalContents from './ModalContents';

interface ModalManagementProps {
  modal:boolean;
  text:string;
  closeModal():void;
}

const ModalManagement = ({modal,text,closeModal}:ModalManagementProps) => {
  return (
    <Modal isOpen={modal}>
      <ModalContents
        clickable={closeModal}
        modalText={text}
      />
    </Modal>
  );
};

export default ModalManagement;