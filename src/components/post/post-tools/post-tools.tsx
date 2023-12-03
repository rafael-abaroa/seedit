import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccount, useComment, usePublishCommentEdit, useSubplebbit } from '@plebbit/plebbit-react-hooks';
import { autoUpdate, flip, FloatingFocusManager, offset, shift, useClick, useDismiss, useFloating, useId, useInteractions, useRole } from '@floating-ui/react';
import styles from './post-tools.module.css';
import { FailedLabel, PendingLabel, SpoilerLabel } from '../label';
import challengesStore from '../../../hooks/use-challenges';
import { alertChallengeVerificationFailed } from '../../../lib/utils/challenge-utils';
const { addChallenge } = challengesStore.getState();

interface PostToolsProps {
  cid: string;
  failed?: boolean;
  hasLabel?: boolean;
  isReply?: boolean;
  replyCount?: number;
  spoiler?: boolean;
  subplebbitAddress?: string;
  showReplyForm?: () => void;
}

const ModTools = ({ cid }: PostToolsProps) => {
  const { t } = useTranslation();
  const post = useComment({ commentCid: cid });
  const [isModToolsOpen, setIsModToolsOpen] = useState(false);

  const defaultPublishOptions = {
    removed: post?.removed,
    locked: post?.locked,
    spoiler: post?.spoiler,
    pinned: post?.pinned,
    commentCid: post?.cid,
    subplebbitAddress: post?.subplebbitAddress,
    onChallenge: (...args: any) => addChallenge([...args, post]),
    onChallengeVerification: alertChallengeVerificationFailed,
    onError: (error: Error) => {
      console.warn(error);
      alert(error);
    },
  };
  const [publishCommentEditOptions, setPublishCommentEditOptions] = useState(defaultPublishOptions);
  const { state, publishCommentEdit } = usePublishCommentEdit({ publishCommentEditOptions });

  // close the modal after publishing
  useEffect(() => {
    if (state && state !== 'failed' && state !== 'initializing' && state !== 'ready') {
      setIsModToolsOpen(false);
    }
  }, [state, setIsModToolsOpen]);

  const onCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => setPublishCommentEditOptions((state) => ({ ...state, [e.target.id]: e.target.checked }));

  const onReason = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPublishCommentEditOptions((state) => ({ ...state, reason: e.target.value ? e.target.value : undefined }));

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-start',
    open: isModToolsOpen,
    onOpenChange: setIsModToolsOpen,
    middleware: [offset(2), flip({ fallbackAxisSideDirection: 'end' }), shift()],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const headingId = useId();

  return (
    <>
      <li className={styles.button} ref={refs.setReference} {...getReferenceProps()}>
        <span onClick={() => setIsModToolsOpen(!isModToolsOpen)}>moderate</span>
      </li>
      {isModToolsOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div className={styles.modal} ref={refs.setFloating} style={floatingStyles} aria-labelledby={headingId} {...getFloatingProps()}>
            <div className={styles.modTools}>
              <div className={styles.menuItem}>
                <label>
                  <input onChange={onCheckbox} checked={publishCommentEditOptions.removed} type='checkbox' />
                  {t('removed')}
                </label>
              </div>
              <div className={styles.menuItem}>
                <label>
                  <input onChange={onCheckbox} checked={publishCommentEditOptions.locked} type='checkbox' />
                  locked
                </label>
              </div>
              <div className={styles.menuItem}>
                <label>
                  <input onChange={onCheckbox} checked={publishCommentEditOptions.spoiler} type='checkbox' />
                  {t('spoiler')}
                </label>
              </div>
              <div className={styles.menuItem}>
                <label>
                  <input onChange={onCheckbox} checked={publishCommentEditOptions.pinned} type='checkbox' />
                  {t('announcement')}
                </label>
              </div>
              <div className={`${styles.menuItem} ${styles.menuReason}`}>
                <input type='text' onChange={onReason} defaultValue={post?.reason} size={14} placeholder='reason' />
                <button onClick={publishCommentEdit}>{t('edit')}</button>
              </div>
            </div>
          </div>
        </FloatingFocusManager>
      )}
    </>
  );
};

const ThreadTools = ({ cid, hasLabel, subplebbitAddress, replyCount = 0 }: PostToolsProps) => {
  const { t } = useTranslation();
  const validReplyCount = isNaN(replyCount) ? 0 : replyCount;
  const commentCount = validReplyCount === 0 ? t('post_no_comments') : `${validReplyCount} ${validReplyCount === 1 ? t('post_comment') : t('post_comments')}`;

  return (
    <>
      <li className={`${styles.button} ${!hasLabel ? styles.firstButton : ''}`}>
        <Link to={`/p/${subplebbitAddress}/c/${cid}`}>{commentCount}</Link>
      </li>
      <li className={styles.button}>
        <span>{t('post_share')}</span>
      </li>
      <li className={styles.button}>
        <span>{t('post_save')}</span>
      </li>
      <li className={styles.button}>
        <span>{t('post_hide')}</span>
      </li>
      <li className={styles.button}>
        <span>{t('post_report')}</span>
      </li>
      <li className={styles.button}>
        <span>{t('post_crosspost')}</span>
      </li>
    </>
  );
};

const ReplyTools = ({ cid, hasLabel, showReplyForm }: PostToolsProps) => {
  const { t } = useTranslation();
  return (
    <>
      <li className={`${styles.button} ${!hasLabel ? styles.firstButton : ''}`}>
        <span>{t('reply_permalink')}</span>
      </li>
      <li className={styles.button}>
        <span>{t('reply_embed')}</span>
      </li>
      <li className={styles.button}>
        <span>{t('post_save')}</span>
      </li>
      <li className={styles.button}>
        <span>{t('post_report')}</span>
      </li>
      <li className={!cid ? styles.hideReply : styles.button}>
        <span onClick={() => cid && showReplyForm?.()}>{t('reply_reply')}</span>
      </li>
    </>
  );
};

const PostToolsLabel = ({ cid, failed, isReply, spoiler }: PostToolsProps) => {
  return (
    <span className={styles.label}>
      {spoiler && <SpoilerLabel />}
      {cid === undefined && !isReply && !failed && <PendingLabel />}
      {failed && <FailedLabel />}
    </span>
  );
};

const PostTools = ({ cid, failed, hasLabel = false, isReply, replyCount, spoiler, subplebbitAddress, showReplyForm }: PostToolsProps) => {
  const account = useAccount();
  const authorRole = useSubplebbit({ subplebbitAddress })?.roles?.[account?.author?.address]?.role;
  const isMod = authorRole === 'admin' || authorRole === 'owner' || authorRole === 'moderator';
  hasLabel = spoiler || (cid === undefined && !isReply);

  return (
    <ul className={`${styles.buttons} ${isReply ? styles.buttonsReply : ''} ${hasLabel ? styles.buttonsLabel : ''}`}>
      {hasLabel && <PostToolsLabel cid={cid} failed={failed} isReply={isReply} spoiler={spoiler} />}
      {isReply ? (
        <ReplyTools cid={cid} hasLabel={hasLabel} showReplyForm={showReplyForm} />
      ) : (
        <ThreadTools cid={cid} hasLabel={hasLabel} subplebbitAddress={subplebbitAddress} replyCount={replyCount} />
      )}
      {isMod && <ModTools cid={cid} />}
    </ul>
  );
};

export default PostTools;
