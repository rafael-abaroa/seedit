export type ParamsType = {
  accountCommentIndex?: string;
  commentCid?: string;
  subplebbitAddress?: string;
};

export type ViewType = 'home' | 'pending' | 'post' | 'submit' | 'subplebbit' | 'subplebbit/submit';

const sortTypes = ['/hot', '/new', '/active', '/controversialAll', '/topAll'];

export const isHomeView = (pathname: string): boolean => {
  return pathname === '/' || sortTypes.includes(pathname);
};

export const isPendingView = (pathname: string, params: ParamsType): boolean => {
  return pathname === `/profile/${params.accountCommentIndex}`;
};

export const isPostView = (pathname: string, params: ParamsType): boolean => {
  return params.subplebbitAddress && params.commentCid ? pathname.startsWith(`/p/${params.subplebbitAddress}/c/${params.commentCid}`) : false;
};

export const isSubmitView = (pathname: string): boolean => {
  return pathname === '/submit';
};

export const isSubplebbitView = (pathname: string, params: ParamsType): boolean => {
  return params.subplebbitAddress ? pathname.startsWith(`/p/${params.subplebbitAddress}`) : false;
};

export const isSubplebbitSubmitView = (pathname: string, params: ParamsType): boolean => {
  return params.subplebbitAddress ? pathname === `/p/${params.subplebbitAddress}/submit` : false;
};