import React, { Component, Suspense } from 'react';

/** If one micro-frontend is down, only its area fails; the shell keeps working. */
class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="sh-fallback">
          <h2>{this.props.name} is unavailable</h2>
          <p>The micro-frontend could not be loaded. Is its container running?</p>
          <code>{String(this.state.error.message || this.state.error)}</code>
          <button onClick={() => location.reload()}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Remote({ name, children }) {
  return (
    <Boundary name={name}>
      <Suspense fallback={<div className="sh-loading"><span /></div>}>{children}</Suspense>
    </Boundary>
  );
}
