import React, { Component } from 'react';
import { getCookie } from '../../cookieOperations';
import CreateMessage from './CreateMessage';
import { getBackend } from '../../utility';

class CreateQuestion extends Component {
  constructor(props) {
    super(props);
    this.code = {};
    this.style = {};
    this.lang = {};
    this.state = {
      title: '',
      title_err: '',
      struct: [
        {
          type: 'text',
          value: ''
        }
      ]
    };
  }

  validator = () => {
    this.setState({
      title_err: this.title_validator(),
      descr_err: this.descr_validator()
    });
  }

  title_validator = () => {
    return this.state.title ? '' : 'Введите заголовок вопроса';
  }

  descr_validator = () => {
    var struct = this.state.struct;
    for (var i = 0; i < struct.length; i++)
      if (struct[i].value)
        return '';
    return 'Описание не может быть пустым';
  }

  setStruct = (struct) => this.setState({ struct: struct });

  create = (type) => {
    fetch(getBackend() + '/send_message/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({
        chat: this.props.room.chat.id,
        type: type,
        title: this.state.title,
        struct: this.state.struct
      })
    }).then(res => {
      if (res.status === 200) {
        this.props.switchActiveTab(0, 2);
      } else {
        if (res.status !== 400) {
          if (res.status === 401)
            alert('Необходима авторизация');
          else
            this.props.setError(res.status);
        }
        else
          this.validator();
      }
    })
  }

  render() {
    return (
      <div className="body main-body bg-white p-1 d-flex flex-column">
        <div className="d-flex">
          <a href=' ' onClick={(e) => { e.preventDefault(); return this.props.switchActiveTab(0, 2); }} className="p-a">Назад</a>
          <h4 className="text-primary mx-auto">Создание вопроса</h4>
        </div>
        <label htmlFor="title" className="ml-1">Заголовок</label>
        <div className="container-fluid">
          <input type="text" name="title" id="title" className="form-control" placeholder="Ваш вопрос" value={this.state.title} onChange={e => this.setState({ title: e.target.value })} />
          <span className="text-danger">{this.state.title_err}</span>
        </div>
        <label htmlFor="" className="ml-1 mt-3">Описание</label>
        <span className="text-danger ml-3">{this.state.descr_err}</span>
        <div className="new-message bg-white">
          <CreateMessage struct={this.state.struct} setStruct={this.setStruct} sendMessage={this.create} type="question" />
        </div>
      </div>
    )
  }
}

export default CreateQuestion;