import Link from 'next/link';
import styles from '@/styles/courseSelection.module.css';
import CourseBox from 'components/CourseBox';

function CourseCatalog() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>CornellGPT</h1>
      <p className={styles.subtitle}>What class would you like to learn about today?</p>
      <div className={styles.courseGrid}>
          <CourseBox key={'INFO 2950'} title={'INFO 2950'} professor={'Professor Koenecke'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
          <CourseBox key={'INFO 2040'} title={'INFO 2040'} professor={'Professor David Easley'} />
      </div>
    </div>
  );
}

export default CourseCatalog;