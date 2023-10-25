import { FC, useEffect, useRef } from 'react';
import { Outlet, useLocation, useParams } from 'react-router-dom';
import { Virtuoso, VirtuosoHandle, StateSnapshot } from 'react-virtuoso';
import { useFeed } from '@plebbit/plebbit-react-hooks';
import useDefaultSubplebbits from '../../../hooks/use-default-subplebbits';
import styles from './home.module.css';
import TopBar from '../../topbar/topbar';
import Header from '../../header';
import Post from '../../post';
import Comments from '../comments/comments';

const lastVirtuosoStates: { [key: string]: StateSnapshot } = {};

const NoPosts = () => 'no posts';

const Home: FC = () => {
  const subplebbitAddresses = useDefaultSubplebbits();
  const sortType = useParams<{ sortType: string }>().sortType || 'hot';
  const { subplebbitAddress, commentCid } = useParams();
  const { feed, hasMore, loadMore } = useFeed({ subplebbitAddresses, sortType });
  const loadingStateString = 'loading...';
  const location = useLocation();
  const isCommentsModalOpen = location.pathname === `/p/${subplebbitAddress}/c/${commentCid}`;

  let Footer;
  if (feed?.length === 0) {
    Footer = NoPosts;
  }
  if (hasMore || subplebbitAddresses.length === 0) {
    Footer = () => loadingStateString;
  }

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

  useEffect(() => {
    const setLastVirtuosoState = () => {
      virtuosoRef.current?.getState((snapshot: StateSnapshot) => {
        if (snapshot?.ranges?.length) {
          lastVirtuosoStates[sortType] = snapshot;
        }
      });
    };
    window.addEventListener('scroll', setLastVirtuosoState);
    return () => window.removeEventListener('scroll', setLastVirtuosoState);
  }, [sortType]);

  const lastVirtuosoState = lastVirtuosoStates[sortType];

  return (
    <div>
      <TopBar />
      <Header />
      <div className={styles.content}>
        <Virtuoso
          increaseViewportBy={{ bottom: 1200, top: 1200 }}
          overscan={600}
          totalCount={feed?.length || 0}
          data={feed}
          itemContent={(index, post) => <Post index={index} post={post} />}
          useWindowScroll={!isCommentsModalOpen}
          components={{ Footer }}
          endReached={loadMore}
          ref={virtuosoRef}
          restoreStateFrom={lastVirtuosoState}
          initialScrollTop={lastVirtuosoState?.scrollTop}
        />
      </div>
      {isCommentsModalOpen ? <Comments /> : <Outlet />}
    </div>
  );
};

export default Home;
