import ErrorHandler from '../Errors/ErrorHandler';
import React from 'react';

function Wrapper(props) {
  if (props.error)
    return <div className="body main-body no-border"><ErrorHandler error={props.error} /></div>;
  else if (props.is_loading)
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  else return (props.children);
}

export default Wrapper;