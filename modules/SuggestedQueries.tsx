import React, { useContext } from 'react';
import ThemeContext from '@/contexts/ThemeContext';

const SuggestedQueries = ({
    suggestedQuestions,
    setQuery,
}: {
    suggestedQuestions: string[];
    setQuery: (val: string) => void;
}) => {
    const { styles } = useContext(ThemeContext) || {};

    if (!suggestedQuestions?.length) return null;
    return (
        <div className={styles.questionContainer}>
            <h3 className={styles.questionTitle}>
                Here are some suggestions you can try:
            </h3>
            {suggestedQuestions.map((question) => (
                <button
                    key={question}
                    className={styles.questionChip}
                    onClick={async () => { 
                        setQuery(question)
                    }}
                >
                    <span className={styles.questionIcon}>⤷</span>
                    <span>{question}</span>
                </button>
            ))}
        </div>
    );
};

export default SuggestedQueries;