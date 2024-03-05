import React, { useState } from 'react';
import styles from '@/styles/classCodeModal.module.css';
import classCodesMapping from '@/utils/classCodesMapping.json';


const ClassCodeModal = ({ isVisible, onClose, onSubmit, classCode, setClassCode }) => {
    const [isCodeCorrect, setIsCodeCorrect] = useState(true);

    if (!isVisible) return null;

    const handleSubmit = (e) => {
      e.preventDefault(); // Prevent default form submission
  
      // Convert the object values into a single array of class codes
      const allClassCodes = Object.values(classCodesMapping).flat();
  
      // Check if the classCode exists in the array of allClassCodes
      const isCodeValid = allClassCodes.includes(classCode);
  
      if (isCodeValid) {
          setIsCodeCorrect(true);
          // You can add your onSubmit logic here, or call the passed onSubmit prop
          onSubmit(); // If you want to pass any data to onSubmit, you can do so here
      } else {
          setIsCodeCorrect(false);
      }
  };
  
  

  return (
    <div className={styles.modalOverlay}>
        <div className={styles.modal}>
            <form onSubmit={handleSubmit}> {/* Use form tag */}
                <p className={styles.instructions}>
                Please enter the code provided by your professor. If your professor has not yet announced the class code - please be patient while this is being arranged. Thank You!
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
                    <button type="submit">Submit</button>
                    <button type="button" onClick={onClose}>Close</button>
                </div>
            </form>
        </div>
    </div>
);
  }

export default ClassCodeModal;