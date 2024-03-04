import Link from 'next/link';
import styles from '@/styles/courseBox.module.css';

type CourseBoxProps = {
  namespaceTitle: string;
  professor: string;
  displayTitle: string;
  onClick: () => void;
};

const CourseBox = ({namespaceTitle, displayTitle, professor, onClick }: CourseBoxProps) => {
  return (
    // Wrap the Link with a div so we can apply the onClick to the div

    <div onClick={onClick}>

    {/* <Link href={`/chatbot?course=${namespaceTitle}`}> */}
      <div className={styles.courseBox}>
        <h2 className={styles.courseTitle}>{displayTitle}</h2>
        <p className={styles.professorName}>{professor}</p>
      </div>
    {/* </Link> */}

    </div>

  );
};


export default CourseBox;