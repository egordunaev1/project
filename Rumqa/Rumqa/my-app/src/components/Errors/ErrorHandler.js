import React, { Component } from 'react'
import Error401 from './401';
import Error403 from './403';
import Error404 from './404';
import Error500 from './500';

class ErrorHandler extends Component {
  render() {
    switch (this.props.error) {
      case 401:
        return <Error401 />;
      case 403:
        return <Error403 />;
      case 404:
        return <Error404 />;
      case 500:
        return <Error500 />;
      default:
        return '';
    };
  }
}

export default ErrorHandler;