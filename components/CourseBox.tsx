import Link from 'next/link';
import styles from '@/styles/courseBox.module.css';

type CourseBoxProps = {
  namespaceTitle: string;
  professor: string;
  displayTitle: string;
};

const CourseBox = ({namespaceTitle, displayTitle, professor }: CourseBoxProps) => {
  return (
    <Link href={`/chatbot?course=${namespaceTitle}`}>
      <div className={styles.courseBox}>
        <h2 className={styles.courseTitle}>{displayTitle}</h2>
        <p className={styles.professorName}>{professor}</p>
      </div>
    </Link>
  );
};


export default CourseBox;