import React, { Component } from 'react';
import { getCookie } from '../../cookieOperations';
import CreateMessage from './CreateMessage';
import { getBackend } from '../../utility';
import CreateRoom from './CreateRoom';

class CreateAnswer extends Component {
  constructor(props) {
    super(props);
    this.code = {};
    this.style = {};
    this.lang = {};
    this.state = {
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
        question: this.props.question.id,
        struct: this.state.struct
      })
    }).then(res => {
      if (res.status === 200) {
        res.json().then(res => {
          var question = this.props.question;
          question.answers.push(res);
          this.props.setState({ question: question });
          this.setState({
            struct: [
              {
                type: 'text',
                value: ''
              }
            ]
          })
        })
      } else {
        if (res.status !== 400)
          this.props.setError(res.status);
        else
          this.validator();
      }
    })
  }

  render() {
    return (
      <div className="new-message bg-white bt-5 mt-2 p-2">
        <h5 className="text-primary ml-2">Ваш ответ:</h5>
        <CreateMessage struct={this.state.struct} setStruct={this.setStruct} sendMessage={this.create} type="answer" />
      </div >
    )
  }
}

export default CreateAnswer;