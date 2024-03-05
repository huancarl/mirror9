import React, { useState } from 'react';
import styles from '@/styles/classCodeModal.module.css';

const ClassCodeModal = ({ isVisible, onClose, onSubmit, classCode, setClassCode }) => {
    const [isCodeCorrect, setIsCodeCorrect] = useState(true);

    if (!isVisible) return null;

    // const handleSubmit = () => {
    //     // Logic to check if the class code is correct
    //     // For demonstration, I'm using a dummy condition. Replace it with your actual condition.
    //     if (classCode === "correctCode") {
    //         setIsCodeCorrect(true);
    //         // Your onSubmit logic here
    //     } else {
    //         setIsCodeCorrect(false);
    //     }
    // };

    return (
      <div className={styles.modalOverlay}>
          <div className={styles.modal}>
          <p className={styles.instructions}>
                  Enter in the professor-provided code. If your professor does not have a code setup please be patient with us as we reach out to them.
          </p>
              <div className={styles.inputContainer}>
                  <input 
                      type="text" 
                      placeholder="Enter Class Code"
                      value={classCode} 
                      onChange={(e) => setClassCode(e.target.value)} 
                      className={!isCodeCorrect ? styles.inputError : ''}
                  />
                  {!isCodeCorrect && <div className={styles.invalidCodeMessage}>Invalid Code</div>}
              </div>
              <div className={styles.buttonContainer}>
                    <button onClick={onSubmit}>Submit</button>
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ClassCodeModal;
