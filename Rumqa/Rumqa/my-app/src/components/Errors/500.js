import React from 'react';

function Error500(props) {
  return (
    <div className="alert alert-danger d-flex justify-content-center" role="alert">
      Сервер не отвечает. Проверьте свое интернет-соединение и перезагрузите страницу.
    </div>
  )
}

export default Error500;