import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/professor-prompts.module.css';
import { useRouter } from 'next/router';

function ProfessorModifyPrompt() {
  const [settings, setSettings] = useState({});
    
  const [className, setClassName] = useState('');
  const [classSubject, setClassSubject] = useState('');

  const [defaultSettings, setDefaultSettings] = useState({});
  const [changedSettings, setChangedSettings] = useState(false);

  const customInstructions = useRef<string>('');

  const router = useRouter();
  //don't leave the site yet if you didn't save changes
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (changedSettings && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.events.emit('routeChangeError');
        throw 'routeChange aborted.';
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);

    // Cleanup function
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [changedSettings, router.events]);

  //Get the class name from the router at page load
  useEffect(() => {
    if (router.query.course) {
      const courseTitle = Array.isArray(router.query.course) ? router.query.course[0] : router.query.course;
      setClassName(courseTitle.replace(/ /g, '_'));
    }
  }, [router.query.course]);
      
  useEffect(() => {
    if (router.query.subject) {
      const courseSubject = Array.isArray(router.query.subject) ? router.query.subject[0] : router.query.subject;
      setClassSubject(courseSubject);
    }
  }, [router.query.subject]);

  //Fetch the class settings from the backend
  async function fetchOrSetClassSettings() {

    const response = await fetch('/api/fetchClassSettings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseName: className,
        courseSubject: classSubject
      }),
    });

    const data = await response.json();
    setSettings(data.settings);
    setDefaultSettings(data.default);

  }

  useEffect(() => {
    // Ensure both className and classSubject are set
    if (className) {
      fetchOrSetClassSettings();
    }
  }, [className, classSubject]); 

  type QuestionOption = [string[], string[]]; // Represents the array of default choice and choices
  type Questions = { [key: string]: QuestionOption }; // Represents the questions object
  type Category = [string, Questions]; // Represents the category title and its questions
  type SettingsData = Category[]; // Represents the entire settings data structure

  //Setting rows
  function renderSettingRows(settingsJson: SettingsData) {
    return settingsJson.map(([categoryTitle, questions]) => (

      <React.Fragment key={categoryTitle}>
        <h2 className={styles.settingsSubHeader}>{categoryTitle}</h2>

        {Object.entries(questions).map(([question, options]) => {
          
          if (question === "Custom Instructions") {
            return (
              <>
              <h2 className={styles.settingsSubHeader}>{"Custom Instructions"}</h2>

              <TextboxSettingRow
                key={question}
                label={question}
                name={question}
                initialValue={settings[question]}
                onValueChange={handleTextboxChange}
              />
              </>
            );
          } else {
            return (
              <DropdownSettingRow
                key={question}
                label={question}
                name={question}
                options={options[1]}
                selected={settings[question]}
                onChange={handleSelectChange}
              />
            );
          }
        })}
      </React.Fragment>
    ));
  }

  //Dropdown option selection:
  function DropdownSettingRow({ label, name, options, selected, onChange }) {
    return (
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel}>
          {label}
          <select name={name} value={selected} onChange={onChange} className={styles.settingsSelect}>
            {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
            ))}
          </select>
        </label>
      </div>
    );
  }
  
  function TextboxSettingRow({ label, name, initialValue, onValueChange}) {
    const [value, setValue] = useState(initialValue);
  
    const handleChange = (event) => {
      const newValue = event.target.value;
      setValue(newValue);

      if (onValueChange) {
        onValueChange(newValue);
        customInstructions.current = newValue;
      }
    };  
    return (
      <div className={styles.customInstructionsRow}>
        <label className={styles.customInstructionsLabel}>
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            className={styles.customInstructionsInput}
            placeholder="Provide custom and full instructions manually. You may be as specific and detailed as you'd like."
          />
        </label>
      </div>
    );
  }

  function handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    // Handle the change
    const { name, value } = event.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value
    }));
    if(changedSettings === false){
      setChangedSettings(true);
    }
  }

  function handleTextboxChange(event: React.ChangeEvent<HTMLSelectElement>) {
    // Handle the change
    if(changedSettings === false){
      setChangedSettings(true);
    }
  }

  async function handleButtonClick(){

    const response = await fetch('/api/updateClassSettings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseName: className,
        courseSubject: classSubject,
        settingsToSave: settings, 
        customInstructions: customInstructions.current,
      }),
    });

    setSettings(prevSettings => ({
      ...prevSettings,
      ['Custom Instructions']: customInstructions.current
    }));

    const data = await response.json();

    if(changedSettings === true){
      setChangedSettings(false);
    }
    
  }


  return (
    <div className={styles.settingsContainer}>

        <h1 className={styles.settingsHeader}>Update Instruction Settings</h1>

        {defaultSettings && defaultSettings["baseline"] && renderSettingRows(defaultSettings['baseline'])}    
        {defaultSettings && defaultSettings[classSubject] && renderSettingRows(defaultSettings[classSubject])}  

        {/* <div className={styles.customInstructionsContainer}>
          <h2 className={styles.settingsSubHeader}>Custom Instructions</h2>
          <textarea
            className={styles.customInstructionsInput}
            placeholder="Provide custom and full instructions manually. You may be as specific and detailed as you'd like."
          />
          <button className={styles.confirmButton}>Confirm</button>
        </div> */}

        <button className={styles.confirmButton} onClick={handleButtonClick}>Confirm</button>

    </div>
    );
}


export default ProfessorModifyPrompt;
