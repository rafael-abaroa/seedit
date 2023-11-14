import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PublishCommentOptions, useAccount, usePublishComment, useSubplebbit } from '@plebbit/plebbit-react-hooks';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { alertChallengeVerificationFailed } from '../../lib/utils/challenge-utils';
import { isValidENS, isValidIPFS, isValidURL } from '../../lib/utils/validation-utils';
import styles from './submit.module.css';
import challengesStore from '../../hooks/use-challenges';

type SubmitState = {
  subplebbitAddress: string | undefined;
  title: string | undefined;
  content: string | undefined;
  link: string | undefined;
  publishCommentOptions: PublishCommentOptions;
  setSubmitStore: (data: Partial<SubmitState>) => void;
  resetSubmitStore: () => void;
};

const { addChallenge } = challengesStore.getState();

const useSubmitStore = create<SubmitState>((set) => ({
  subplebbitAddress: undefined,
  title: undefined,
  content: undefined,
  link: undefined,
  publishCommentOptions: {},
  setSubmitStore: ({ subplebbitAddress, title, content, link }) =>
    set((state) => {
      const nextState = { ...state };
      if (subplebbitAddress !== undefined) nextState.subplebbitAddress = subplebbitAddress;
      if (title !== undefined) nextState.title = title;
      if (content !== undefined) nextState.content = content;
      if (link !== undefined) nextState.link = link;

      nextState.publishCommentOptions = {
        ...nextState,
        onChallenge: (...args: any) => addChallenge(args),
        onChallengeVerification: alertChallengeVerificationFailed,
        onError: (error: Error) => {
          console.error(error);
          // TODO: remove this explanation when pubsub providers uptime is fixed:
          let errorMessage = error.message;
          if (errorMessage === 'The challenge request has been published over the pubsub topic but no response was received') {
            errorMessage +=
              '. This means seedit web is currently offline, download seedit desktop which is fully peer-to-peer: https://github.com/plebbit/seedit/releases/latest';
          }
          alert(errorMessage);
        },
      };
      return nextState;
    }),
  resetSubmitStore: () => set({ subplebbitAddress: undefined, title: undefined, content: undefined, link: undefined, publishCommentOptions: undefined }),
}));

const Submit = () => {
  const account = useAccount();
  const { t } = useTranslation();
  const params = useParams();
  const paramsSubplebbitAddress = params.subplebbitAddress;
  const [inputAddress, setInputAddress] = useState('');
  const [selectedSubplebbit, setSelectedSubplebbit] = useState(paramsSubplebbitAddress);
  const subplebbit = useSubplebbit({ subplebbitAddress: selectedSubplebbit });
  const navigate = useNavigate();
  const [readyToPublish, setReadyToPublish] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const subplebbitAddressRef = useRef<HTMLInputElement>(null);

  const { subplebbitAddress, publishCommentOptions, setSubmitStore, resetSubmitStore } = useSubmitStore();
  const { index, publishComment } = usePublishComment(publishCommentOptions);
  const { subscriptions } = account || {};

  useEffect(() => {
    document.title = t('submit_to_before') + (selectedSubplebbit ? subplebbit?.title || subplebbit?.shortAddress : 'seedit') + t('submit_to_after');
  }, [selectedSubplebbit, subplebbit, t]);

  const onPublish = () => {
    if (!titleRef.current?.value) {
      alert(`Missing title`);
      return;
    }
    if (linkRef.current?.value && !isValidURL(linkRef.current?.value)) {
      alert(`Invalid URL`);
      return;
    }
    if (!subplebbitAddressRef.current?.value) {
      alert(`Missing community address`);
      return;
    }
    if (!isValidENS(subplebbitAddressRef.current?.value) && !isValidIPFS(subplebbitAddressRef.current?.value)) {
      alert(`Invalid community address`);
      return;
    }

    setSubmitStore({
      subplebbitAddress: subplebbitAddressRef.current?.value,
      title: titleRef.current?.value,
      content: contentRef.current?.value || undefined,
      link: linkRef.current?.value || undefined,
    });

    setReadyToPublish(true);
  };

  useEffect(() => {
    if (readyToPublish) {
      publishComment();
      setReadyToPublish(false);
    }
  }, [readyToPublish, publishComment]);

  const subplebbitHeaderLink = (
    <Link to={`/p/${subplebbitAddress}`} className={styles.location} onClick={(e) => e.preventDefault()}>
      {subplebbit?.title || subplebbit?.shortAddress}
    </Link>
  );

  useEffect(() => {
    if (typeof index === 'number') {
      resetSubmitStore();
      navigate(`/profile/${index}`);
    }
  }, [index, resetSubmitStore, navigate]);

  const subsDescription = <div className={styles.subsDescription}>{subscriptions.length > 0 ? t('submit_subscriptions') : t('submit_subscriptions_notice')}</div>;

  const subs = (
    <div className={styles.subs}>
      {subscriptions.map((sub: string) => (
        <span
          key={sub}
          className={styles.sub}
          onClick={() => {
            if (subplebbitAddressRef.current) {
              subplebbitAddressRef.current.value = sub;
            }
          }}
        >
          {sub}
        </span>
      ))}
    </div>
  );

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputAddress(e.target.value);
  };

  useEffect(() => {
    if (inputAddress) {
      if (isValidENS(inputAddress) || isValidIPFS(inputAddress)) {
        setSelectedSubplebbit(inputAddress);
      }
    }
  }, [inputAddress]);

  return (
    <div className={styles.content}>
      <h1>
        {t('submit_to_before')}
        {selectedSubplebbit ? subplebbitHeaderLink : 'seedit'}
        {t('submit_to_after')}
      </h1>
      <div className={styles.form}>
        <div className={styles.formContent}>
          <div className={styles.box}>
            <span className={styles.boxTitleOptional}>url</span>
            <span className={styles.optional}> ({t('optional')})</span>
            <div className={styles.boxContent}>
              <input className={`${styles.input} ${styles.inputUrl}`} type='text' ref={linkRef} />
              <div className={styles.description}>{t('submit_url_description')}</div>
            </div>
          </div>
          <div className={styles.box}>
            <span className={styles.boxTitleRequired}>{t('title')}</span>
            <div className={styles.boxContent}>
              <textarea className={`${styles.input} ${styles.inputTitle}`} ref={titleRef} />
            </div>
          </div>
          <div className={styles.box}>
            <span className={styles.boxTitleOptional}>{t('text')}</span>
            <span className={styles.optional}> ({t('optional')})</span>
            <div className={styles.boxContent}>
              <textarea className={`${styles.input} ${styles.inputText}`} ref={contentRef} />
            </div>
          </div>
          <div className={styles.box}>
            <span className={styles.boxTitleRequired}>{t('submit_choose')}</span>
            <div className={styles.boxContent}>
              <span className={styles.boxSubtitle}>{t('community_address')}:</span>
              <input
                className={`${styles.input} ${styles.inputCommunity}`}
                type='text'
                placeholder={`"community.eth" ${t('or')} "12D3KooW..."`}
                defaultValue={selectedSubplebbit ? paramsSubplebbitAddress : undefined}
                ref={subplebbitAddressRef}
                onChange={handleAddressChange}
              />
              {subsDescription}
              {subs}
            </div>
          </div>
          {subplebbit?.rules && (
            <div className={styles.box}>
              <span className={`${styles.boxTitle} ${styles.rulesTitle}`}>
                {t('rules_for')} p/{subplebbit?.shortAddress}
              </span>
              <div className={styles.boxContent}>
                <div className={styles.description}>
                  <ol className={styles.rules}>{subplebbit?.rules.map((rule: string, index: number) => <li key={index}>{rule}</li>)}</ol>
                </div>
              </div>
            </div>
          )}
          <div className={`${styles.box} ${styles.notice}`}>{t('submit_notice')}</div>
          <div>*{t('required')}</div>
          <div className={styles.submit}>
            <button className={styles.submitButton} onClick={onPublish}>
              {t('submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Submit;