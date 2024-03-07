import React, { useState } from 'react';
import styles from '@/styles/professor-prompts.module.css';

function ProfessorModifyPrompt() {
    const [settings, setSettings] = useState({
      logisticQuestions: false,
      classMaterialsOnly: false,
      classAndExternalMaterials: false,
      assistHomeworkGuidance: false,
      assistHomeworkSolutions: false,
      computeCalculations: false,
      writingSkillsDevelopment: false,
      regularUpdates: false,
    });

    const handleCheckboxChange = (event) => {
      const { name, checked } = event.target;
      setSettings(prev => ({
        ...prev,
        [name]: checked,
      }));
    };

    return (
      <div className={styles.settingsContainer}>
        <h1 className={styles.settingsHeader}>Update Instruction Settings</h1>

        <h2 className={styles.settingsSubHeader}>General Questions</h2>
        <SettingRow
          label="Answers only class logistic questions about the class (when are office hours, what is the grade breakdown, etc), and does not answer otherwise at all?"
          name="logisticQuestions"
          checked={settings.logisticQuestions}
          onChange={handleCheckboxChange}
        />
        <SettingRow
          label="Answers questions strictly and only using class materials from class (no outside references)?"
          name="classMaterialsOnly"
          checked={settings.classMaterialsOnly}
          onChange={handleCheckboxChange}
        />
        <SettingRow
          label="Answers questions using both class materials + outside references?"
          name="classAndExternalMaterials"
          checked={settings.classAndExternalMaterials}
          onChange={handleCheckboxChange}
        />

        <h2 className={styles.settingsSubHeader}>Homework Questions</h2>
        <SettingRow
          label="Assists students with homework but never provides direct solutions(guides student to class materials)?"
          name="assistHomeworkGuidance"
          checked={settings.assistHomeworkGuidance}
          onChange={handleCheckboxChange}
        />
        <SettingRow
          label="Assists students with homework by providing direct solutions?"
          name="assistHomeworkSolutions"
          checked={settings.assistHomeworkSolutions}
          onChange={handleCheckboxChange}
        />
        <SettingRow
          label="Computes calculations for students?"
          name="computeCalculations"
          checked={settings.computeCalculations}
          onChange={handleCheckboxChange}
        />

        <h2 className={styles.settingsSubHeader}>Writing Questions</h2>
        <SettingRow
          label="Assists in developing students' writing skills, focusing on aspects like critical analysis, structure, and clarity, without generating content for them?"
          name="writingSkillsDevelopment"
          checked={settings.writingSkillsDevelopment}
          onChange={handleCheckboxChange}
        />

        <h2 className={styles.settingsSubHeader}>Report</h2>
        <SettingRow
          label="Would you like to receive regular updates or reports on student interactions with the chatbot?"
          name="regularUpdates"
          checked={settings.regularUpdates}
          onChange={handleCheckboxChange}
        />
<div className={styles.customInstructionsContainer}>
  <h2 className={styles.settingsSubHeader}>Custom Instructions</h2>
  <textarea
    className={styles.customInstructionsInput}
    placeholder="Provide custom and full instructions manually. You may be as specific and detailed as you'd like."
  />
  <button className={styles.confirmButton}>Confirm</button>
</div>

      </div>
    );
}

function SettingRow({ label, name, checked, onChange }) {
    return (
      <div className={styles.settingsRow}>
        <label className={styles.settingsLabel}>
          {label}
          <input
            type="checkbox"
            name={name}
            checked={checked}
            onChange={onChange}
            className={styles.settingsCheckbox}
          />
        </label>
      </div>
    );
}

export default ProfessorModifyPrompt;
