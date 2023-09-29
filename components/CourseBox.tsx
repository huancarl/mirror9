import Link from 'next/link';
import styles from '@/styles/courseBox.module.css';

type CourseBoxProps = {
  title: string;
  professor: string;
};

const CourseBox = ({ title, professor }: CourseBoxProps) => {
  return (
    <Link href={`/chatbot?course=${title}`}>
      <div className={styles.courseBox}>
        <h3>{title}</h3>
        <p>{professor}</p>
      </div>
    </Link>
  );
};

export default CourseBox;