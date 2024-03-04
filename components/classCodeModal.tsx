import styles from '@/styles/classCodeModal.module.css';


const ClassCodeModal = ({ isVisible, onClose, onSubmit, classCode, setClassCode }) => {
    if (!isVisible) return null;
  
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <input type="text" placeholder="Enter Class Code" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
          <button onClick={onSubmit}>Submit</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  };

  export default ClassCodeModal;