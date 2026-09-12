'use client';

export default function Error({ reset }) {
  return <div className="container py-5"><div className="section-card p-4"><h2>Something went wrong.</h2><p className="muted-copy">This page could not load right now.</p><button className="btn btn-primary" onClick={() => reset()}>Try again</button></div></div>;
}
