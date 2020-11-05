import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Interweave from 'interweave';
import CreateAnswer from './CreateAnswer';
import { getCookie } from '../../cookieOperations';
import { getBackend } from '../../utility';


function BrowseText(props) {
  var block = props.block;
  return (
    <div className="mt-2">
      <Interweave content={block.value} />
    </div>
  )
}

class BrowseCode extends Component {
  code = React.createRef()

  copyCode = () => {
    var selection = window.getSelection();
    selection.selectAllChildren(this.code.current);
  }

  render() {
    var block = this.props.block;
    return (
      <div>
        <div className="d-flex">
          <a className="copy-code ml-auto" onClick={() => this.copyCode()}>Выделить код</a>
        </div>
        <style type="text/css">
          {block.value.css};
        </style>
        <div ref={this.code} style={{ borderRadius: '5px' }}><Interweave content={block.value.code} /></div>
      </div>
    )
  }
}

function BrowseImage(props) {
  var block = props.block;
  return (
    <div>
      {
        block.value.map((image, ind) => (
          <img alt="" className="b-image cursor-pointer mt-1" src={image} key={ind} onClick={() => props.openImage(image)} />
        ))
      }
    </div>
  )
}

function ChooseType(props) {
  var block = props.block;
  switch (block.type) {
    case 'code':
      return <BrowseCode block={block} />
    case 'text':
      return <BrowseText block={block} />
    case 'image':
      return <BrowseImage openImage={props.openImage} block={block} />
  }
}

function BrowseQuestion(props) {
  var question = JSON.parse(props.question.question_body.content);
  var creator = props.question.creator;

  return (
    <div className="question bg-mes p-1 pb-2">
      <div className="d-flex q-creator pt-2">
        <div className="ml-1 d-flex">
          <Link to={"/profile/" + creator.id}>
            <img alt="" src={getBackend() + '' + creator.profile.cover} className="cover-img" width="32px" height="32px" />
            <span className="mt-1 ml-1 text-black">{creator.profile.first_name} {creator.profile.last_name}</span>
          </Link>
        </div>
      </div>
      {
        question.map((block, ind) => (
          <div key={ind} className="px-1">
            <ChooseType key={'ct' + ind} block={block} openImage={props.openImage} />
          </div>
        ))
      }
    </div>
  )
}

function BrowseAnswer(props) {
  var answer = JSON.parse(props.answer.body.content);
  var is_best = props.is_best;
  var dbe = props.does_best_exists;
  var creator = props.answer.creator;
  var iuqc = props.is_user_q_creator;
  var iuac = (props.user && props.user.id === creator.id);
  var likes = props.answer.likes;

  return (
    <div className={"answer pb-1 my-1 mx-1 bg-" + (is_best ? 'best' : 'light')}>
      <div className="d-flex a-creator pt-2">
        <div className="ml-1 container-fluid p-0 d-flex">
          <Link to={"/profile/" + creator.id}>
            <img alt="" src={getBackend() + '' + creator.profile.cover} className="cover-img" width="32px" height="32px" />
            <span className="mt-1 ml-1 text-black">{creator.profile.first_name} {creator.profile.last_name}</span>
          </Link>
          <div className="cursor-pointer ml-3" onClick={() => props.like(props.answer.id, '+')}>
            <img alt="" src={getBackend() + "/media/images/icons/like.png"} height="16px" />
          </div>
          <div className={"mx-1 grading text-" + (likes < 0 ? 'danger' : 'success')}>{likes}</div>
          <div className="cursor-pointer mt-1" onClick={() => props.like(props.answer.id, '-')}>
            <img alt="" src={getBackend() + "/media/images/icons/dislike.png"} height="16px" />
          </div>
          {
            iuqc && !dbe && !iuac &&
            <a className="ml-auto mr-2 text-primary cursor-pointer" onClick={() => props.chooseBest(props.answer.id)}>Выбрать лучшим</a>
          }
        </div>
      </div>
      <div className="px-2">
        {
          answer.map((block, ind) => (
            <div key={ind}>
              <ChooseType key={'ct' + ind} block={block} openImage={props.openImage} />
            </div>
          ))
        }
      </div>
    </div>
  )
}

function QPTopPanel(props) {
  return (
    <div className="container-fluid bg-primary text-white p-1 no-bb">
      <div className="row no-gutters">
        <div className="col-10">Заголовок</div>
        <div className="col-2 before-sep">Создан</div>
      </div>
    </div>
  )
}

function QPQuestion(props) {
  let q = props.question;
  return (
    <div className="row no-gutters nested_room p-1">
      <div className="col-10 text-dark pl-1 pt-1"><h5>{q.title}</h5></div>
      <div className="col-2 to-el text-dark pl-1">{q.creator.username}</div>
    </div>
  )
}

class Question extends Component {
  constructor(props) {
    super(props);
    this.state = {
      question: null
    }
  }

  componentDidMount() {
    this.getQuestion(this.props.question);
  }

  like = (id, l) => {
    fetch(getBackend() + '/like/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({
        answer_id: id,
        l: l
      })
    }).then(res => {
      if (res.status === 200) {
        res.json().then(res => {
          var question = this.state.question;
          for (var i = 0; i < question.answers.length; i++) {
            if (question.answers[i].id === id) {
              question.answers[i].likes = res;
            }
          }
          this.setState({ question: question });
        })
      } else {
        this.props.setError(res.status);
      }
    });
  }

  getQuestion = (id) => {
    var headers = (getCookie('token') ? { Authorization: `JWT ${getCookie('token')}` } : {});
    fetch(getBackend() + '/get_questions/' + this.props.room.id + '/' + id, {
      method: 'GET',
      headers: headers
    }).then(res => {
      if (res.status === 200)
        res.json().then(res => this.setState({ question: res }));
      else this.props.setError(res.status);
    })
  }

  chooseBest = (answer_id) => {
    fetch(getBackend() + '/choose_best/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({
        answer_id: answer_id
      })
    }).then(res => {
      if (res.status === 200) {
        var question = this.state.question;
        question.best_answer = answer_id;
        this.setState({ question: question });
      } else {
        this.props.setError(res.status);
      }
    });
  }

  render() {
    let q = this.state.question;
    if (!q) {
      return (
        <div className="d-flex">
          <div className="spinner-border mx-auto" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )
    }
    return (
      <div className="body main-body">
        <div className="p-1 bg-white" style={{ borderRadius: '5px 5px 0 0' }}>
          <Link to={this.props.location.pathname}>Назад</Link>
        </div>
        <div className="bg-mes p-2"><h5 className="mb-0">{q.title}</h5></div>
        <BrowseQuestion user={this.props.user} openImage={this.props.openImage} question={q} />
        {
          q.answers.map((ans, ind) => (
            <BrowseAnswer like={this.like} key={ind} chooseBest={this.chooseBest} user={this.props.user} openImage={this.props.openImage} answer={ans} does_best_exists={q.best_answer && true} is_best={q.best_answer && q.best_answer === ans.id} is_user_q_creator={this.props.user && q.creator.id === this.props.user.id} />
          ))
        }
        {this.props.user ? <CreateAnswer setState={data => this.setState(data)} question={q} room={this.props.room} user={this.props.user} setError={this.props.setError} switchActiveTab={this.props.switchActiveTab} /> : ''}
      </div>
    )
  }
}

class QuestionPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      opened: false,
      questions: [],
      question: null,
      is_loading: true,
      page: 1
    }
  }

  componentDidMount() {
    this.getQuestions();
  }

  getSearchArgs(search) {
    search = search.split(/[&?]/);
    let args = {}
    search.forEach(s => {
      if (s) {
        s = s.split('=');
        args[s[0]] = s[1];
      }
    });
    return args;
  }

  openImage = (src) => {
    this.setState({ opened: src });
  }

  closeImage = () => {
    this.setState({ opened: null });
  }

  getQuestions = (page = this.state.page) => {
    this.setState({ is_loading: true });
    var headers = (getCookie('token') ? { Authorization: `JWT ${getCookie('token')}` } : {});
    fetch(getBackend() + '/get_questions/many/' + this.props.room.id + '/' + page, {
      method: 'GET',
      headers: headers
    }).then(res => {
      if (res.status === 200)
        res.json().then(res => this.setState({ questions: res, is_loading: false }));
      else this.props.setError(res.status);
    })
  }

  render() {
    let questions = this.state.questions;
    let pages = Math.ceil(this.props.room.questions / 10);
    let left = []
    let right = []
    for (let i = this.state.page - 1; i >= 1; i--)
      left.push(i);
    for (let i = this.state.page + 1; i <= Math.min(pages, this.state.page + 5); i++)
      right.push(i);
    left.reverse()
    let search = this.getSearchArgs(this.props.location.search);
    let path = this.props.location.pathname;
    path = (path.endsWith('/') ? path : path + '/');

    if (!search['q'])
      if (this.state.is_loading)
        return (
          <div className="body main-body d-flex">
            <div className="spinner-border mx-auto" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )
      else return (
        <div className="body main-body">
          <QPTopPanel />
          <div className="container-fluid bg-white p-0">
            {
              questions.map((q, ind) => (
                <div key={ind + 'div1'}>
                  <Link to={path + '?q=' + q.id} key={ind + 'l1'}><QPQuestion key={ind + 'kp'} question={q} /></Link>
                  <div className="sep m-0" key={ind + 'div2'}></div>
                </div>
              ))
            }
            <div className="container-fluid d-flex p-0">
              <button className="btn btn-success m-1" onClick={() => this.props.switchActiveTab(0, 7)} disabled={!this.props.user}>Создать вопрос</button>
              <nav aria-label="Page navigation example" className="ml-auto my-1">
                <ul className="pagination my-auto mr-1">
                  <li className="page-item"><a className="page-link" href="" onClick={(e) => { var page = 1; this.setState({ page: page }); this.getQuestions(page); e.preventDefault(); }}>First</a></li>
                  {left.map((p, ind) => (
                    <li className="page-item" key={ind + "l"}><a href="" key={ind + "a"} className="page-link" onClick={(e) => { var page = p; this.setState({ page: page }); this.getQuestions(page); e.preventDefault(); }}>{p}</a></li>
                  ))}
                  <li className="page-item active"><a href="" className="page-link" onClick={(e) => { var page = this.state.page; this.setState({ page: page }); this.getQuestions(page); e.preventDefault(); }}>{this.state.page}</a></li>
                  {right.map((p, ind) => (
                    <li className="page-item" key={ind + "l"}><a href="" key={ind + "a"} className="page-link" onClick={(e) => { var page = p; this.setState({ page: page }); this.getQuestions(page); e.preventDefault(); }}>{p}</a></li>
                  ))}
                  <li className="page-item"><a className="page-link" href="" onClick={(e) => { var page = pages; this.setState({ page: page }); this.getQuestions(page); e.preventDefault(); }}>Last</a></li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      );
    else {
      return (
        <div>
          <Question user={this.props.user} location={this.props.location} question={search['q']} room={this.props.room} setError={this.props.setError} openImage={this.openImage} />
          {
            this.state.opened &&
            <div className="opened cursor-pointer d-flex" onClick={() => this.closeImage()}>
              <center className="mx-auto my-auto">
                <img alt="" src={this.state.opened} style={{ maxHeight: document.documentElement.clientHeight + 'px' }} />
              </center>
            </div>
          }
        </div>
      )
    }
  }
}

export default QuestionPage;