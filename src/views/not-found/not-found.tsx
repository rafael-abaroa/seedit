import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import styles from './not-found.module.css';

interface NotFoundState {
  isNotFound: boolean;
  setNotFound: (isNotFound: boolean) => void;
}

export const useNotFoundStore = create<NotFoundState>((set) => ({
  isNotFound: false,
  setNotFound: (isNotFound: boolean) => set({ isNotFound }),
}));

const NotFound = () => {
  const { t } = useTranslation();
  const setNotFound = useNotFoundStore((state) => state.setNotFound);

  useEffect(() => {
    setNotFound(true);
    return () => setNotFound(false); // Reset on unmount
  }, [setNotFound]);

  return (
    <div className={styles.content}>
      <div className={styles.notFound}>
        <h1>{t('page_not_found')}</h1>
        <p>{t('not_found_description')}</p>
      </div>
    </div>
  );
};

export default NotFound;
