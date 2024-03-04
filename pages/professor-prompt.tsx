import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from '@/styles/professor-prompts.module.css';
import {withSession, isAuthenticated} from 'utils/session';
import { useRouter } from 'next/router';


function ProfessorModifyPrompt() {
    // Example state for the settings
    const [settings, setSettings] = useState({
      setting1: false,
      setting2: false,
      setting3: false,
      setting4: false, 
      inputSetting: '',
      // Add more settings as needed
    });
  
    // Handle change for checkboxes
    const handleCheckboxChange = (event) => {
      const { name, checked } = event.target;
      setSettings((prevSettings) => ({
        ...prevSettings,
        [name]: checked,
      }));
    };
  
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setSettings(prevSettings => ({
          ...prevSettings,
          [name]: value,
        }));
      };

    return (
      <div className={styles.settingsContainer}>
        <h1 className={styles.settingsHeader}>Class Chatbot Settings</h1>
        <div className={styles.settingsRow}>
          <label className={styles.settingsLabel}>
            Chatbot uses internet access to base its answers
            <input
              type="checkbox"
              name="setting1"
              checked={settings.setting1}
              onChange={handleCheckboxChange}
              className={styles.settingsCheckbox}
            />
          </label>
        </div>
        <div className={styles.settingsRow}>
          <label className={styles.settingsLabel}>
            Chatbot never gives direct answers to questions
            <input
              type="checkbox"
              name="setting2"
              checked={settings.setting2}
              onChange={handleCheckboxChange}
              className={styles.settingsCheckbox}
            />
          </label>
        </div>
        <div className={styles.settingsRow}>
          <label className={styles.settingsLabel}>
            Chatbot only can answer logistical questions about the class
            <input
              type="checkbox"
              name="setting3"
              checked={settings.setting3}
              onChange={handleCheckboxChange}
              className={styles.settingsCheckbox}
            />
          </label>
        </div>
        <div className={styles.settingsRow}>
          <label className={styles.settingsLabel}>
            Chatbot always uses code to support its responses
            <input
              type="checkbox"
              name="setting4"
              checked={settings.setting4}
              onChange={handleCheckboxChange}
              className={styles.settingsCheckbox}
            />
          </label>
        </div>

        <div className={styles.settingsRow}>
        <label className={styles.settingsLabel}>
          Custom ChatBot Instructions
          <input
            type="text"
            name="inputSetting"
            value={settings.inputSetting}
            onChange={handleInputChange}
            className={styles.settingsInput}
          />
        </label>
      </div>

      </div>
    );
  }
  
  export default ProfessorModifyPrompt;