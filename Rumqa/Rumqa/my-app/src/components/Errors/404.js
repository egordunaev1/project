import React from 'react';
import {
  Link
} from "react-router-dom";

function Error404(props) {
  return (
    <div id="notfound">
      <div className="notfound">
        <h2>We are sorry, Page not found!</h2>
        <p>The page you are looking for might have been removed had its name changed or is temporarily unavailable.</p>
        <Link to="/Main">Back To Homepage</Link>
      </div>
    </div>
  );
}

export default Error404;