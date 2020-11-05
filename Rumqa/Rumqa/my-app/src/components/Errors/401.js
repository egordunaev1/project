import React from 'react';
import {Link} from 'react-router-dom';

function Error401(props) {
  return (
    <div className="alert alert-danger d-flex justify-content-center" role="alert">
      Вы не авторизованы. Пожалуйста, войдите или&nbsp;<Link to="/registration" className="alert-link">зарегистрируйтесь</Link>.
    </div>
  )
}

export default Error401;