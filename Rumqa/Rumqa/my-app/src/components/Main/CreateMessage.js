import React, { Component } from 'react';
import Interweave from 'interweave';
import {getCookie} from '../../cookieOperations';
import { getBackend } from '../../utility';

function ChooseBlock(props) {
  const cur = props.current_block;
  return (
    <div>
      <div className="d-flex">
        <img alt="" src={getBackend() + "/media/images/icons/textblock.png"} width="30px" height="30px" className={"cursor-pointer " + (cur === 'text' ? '' : 'not-') + "active-icon"} onClick={() => props.handleChangeType(props.ind, 'text')} />
        <img alt="" src="http://xn----7sb9ahdajscmg.xn--p1ai/images/35.png" width="30px" height="30px" className={"imageblockicon cursor-pointer " + (cur === 'image' ? '' : 'not-') + "active-icon"} onClick={() => props.handleChangeType(props.ind, 'image')} />
        <img alt="" src={getBackend() + '/media/images/icons/codeblock.png'} width="30px" height="30px" className={"cursor-pointer " + (cur === 'code' ? '' : 'not-') + "active-icon"} onClick={() => props.handleChangeType(props.ind, 'code')} />
      </div>
      {props.ind !== 0 ?
        <div className="d-flex mt-1">
          <button className="btn-sm btn-danger" onClick={() => props.deleteBlock(props.ind)}>Удалить</button>
        </div>
        :
        <div className="d-flex mt-1">
          {/* <img alt="" src={getBackend() + "/media/images/icons/send.png"} width="30px" className="cursor-pointer" onClick={() => props.sendMessage()} />*/}
          <button className="btn-sm btn-success" onClick={() => props.sendMessage()}>Отправить</button>
        </div>
      }
    </div>
  )
}

function AddBlock(props) {
  return (
    <div className="container-fluid my-2 addblock d-flex">
      <img alt="" src={getBackend() + "/media/images/icons/add.png"} height="30px" onClick={() => props.addBlock(props.ind)} className="cursor-pointer mx-auto" />
    </div>
  )
}

function textarea_resize(event, line_height, min_line_count) {
  var min_line_height = min_line_count * line_height;
  var obj = event.target;
  var obj_height = line_height * (obj.value.split('\n').length);
  obj.style.height = "calc(" + Math.max(min_line_height, obj_height) + 'px + .50rem)';
}

class CodeBlock extends Component {
  code = React.createRef();
  style = React.createRef();
  lang = React.createRef();
  divcode = React.createRef();
  timeout = null;

  insertTab = (evt = null) => {
    let obj = evt.target
    evt = evt || window.event;
    var keyCode = evt.keyCode || evt.which || 0;

    if (keyCode === 9) {
      if (document.selection) {
        document.selection.createRange().duplicate().text = "\t";
      }
      else if (obj.setSelectionRange) {
        var start = obj.selectionStart;
        var end = obj.selectionEnd;
        var strFirst = obj.value.substr(0, start);
        var strLast = obj.value.substr(end, obj.value.length);
        if (obj.selectionStart === obj.selectionEnd) {
          obj.value = strFirst + "\t" + strLast;
          var cursor = strFirst.length + "\t".length;
          obj.selectionStart = obj.selectionEnd = cursor;
        }
        else {
          var firstn = obj.value.lastIndexOf('\n', obj.selectionStart);
          var lastn = obj.value.lastIndexOf('\n', obj.selectionEnd - 1);
          obj.value = obj.value.replace(/\n/g, (str, pos) => { return ((pos < firstn || pos > lastn) ? '\n' : '\n\t') });
          if (firstn === -1)
            obj.value = '\t' + obj.value;
          obj.selectionStart = strFirst.length;
          obj.selectionEnd = obj.value.length - strLast.length;
        }
      }

      if (evt.preventDefault && evt.stopPropagation) {
        evt.preventDefault();
        evt.stopPropagation();
      }
      else {
        evt.returnValue = false;
        evt.cancelBubble = true;
      }
      this.getCode();
      return false;
    }
    else if (keyCode === 13) {
      var strFirst = obj.value.substr(0, obj.selectionStart);
      var strLast = obj.value.substr(obj.selectionEnd, obj.value.length);
      var add = '';

      for (let i = strFirst.lastIndexOf('\n') + 1; i < strFirst.length; i++)
        if (strFirst[i] === '\t')
          add += '\t';

      obj.value = strFirst + '\n' + add + strLast;

      var cursor = strFirst.length + 1 + add.length;

      obj.selectionStart = obj.selectionEnd = cursor;

      if (evt.preventDefault && evt.stopPropagation) {
        evt.preventDefault();
        evt.stopPropagation();
      }
      else {
        evt.returnValue = false;
        evt.cancelBubble = true;
      }
      this.getCode();
    }
  }

  getCode = () => {
    let _code = this.code.current;
    let _style = this.style.current;
    let _lang = this.lang.current;
    return this.props.getCode(this.props.ind, _code, _style, _lang);
  }

  componentDidMount() {
    this.getCode();

    this.code.current.addEventListener('keyup', function () {
      if (this.scrollTop > 0) {
        this.style.height = this.scrollHeight + "px";
      }
    });

    this.code.current.addEventListener("input", () => {
      if (this.timeout)
        window.clearTimeout(this.timeout);
      this.timeout = window.setTimeout(() => {
        this.getCode();
      }, 1000);
    }, false);

    this.style.current.addEventListener("input", () => {
      this.getCode();
    }, false);

    this.lang.current.addEventListener("input", () => {
      this.getCode();
    }, false);
  }

  render() {
    let styles = ['default', 'emacs', 'friendly', 'colorful', 'autumn', 'murphy', 'manni', 'monokai', 'perldoc', 'pastie', 'borland', 'trac', 'native', 'fruity', 'bw', 'vim', 'vs', 'tango', 'rrt', 'xcode', 'igor', 'paraiso-light', 'paraiso-dark', 'lovelace', 'algol', 'algol_nu', 'arduino', 'rainbow_dash', 'abap', 'solarized-dark', 'solarized-light', 'sas', 'stata', 'stata-light', 'stata-dark', 'inkpot']
    return (
      <div className="container-fluid pl-0">
        <div className="d-flex flex-row-reverse container-fluid pr-0">
          <ChooseBlock sendMessage={this.props.sendMessage} handleChangeType={this.props.handleChangeType} ind={this.props.ind} current_block='code' deleteBlock={this.props.deleteBlock} />
          <div className="container-fluid">
            <div className="d-flex">
              <div className="container-fluid p-0">
                <label className="mr-sm-2">Язык</label>
                <select className="custom-select mr-sm-2" ref={this.lang}>
                  <option value="python">Python</option>
                  <option value="cpp">C</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                  <option value="javascript">JavaScript</option>
                  <option value="php">PHP</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="c">C</option>
                </select>
              </div>
              <div className="container-fluid">
                <label className="mr-sm-2">Стиль</label>
                <select className="custom-select mr-sm-2" ref={this.style}>
                  {styles.map((style, ind) => (
                    <option key={ind} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex mt-3">
          <div className="container-fluid ml-3">
            <label className="mr-sm-2">Код</label>
            <textarea ref={this.code} onKeyDown={(e) => this.insertTab(e)} onKeyUp={(e) => textarea_resize(e, 18, 4)} spellCheck="false" className="contenteditable container-fluid bg-white mr-2 mt-1 p-1"></textarea>
          </div>
          <div className="container-fluid">
            <style type="text/css">
              {this.props.value.css};
            </style>
            <label className="mr-sm-2">Подсветка</label>
            <Interweave content={this.props.value.code} />
          </div>
        </div>
        <AddBlock ind={this.props.ind} addBlock={this.props.addBlock} />
      </div>
    )
  }
}

function ImageBlock(props) {
  return (
    <div className="container-fluid pl-0">
      <div className="d-flex flex-row-reverse container-fluid pr-0 pl-0">
        <ChooseBlock sendMessage={props.sendMessage} handleChangeType={props.handleChangeType} ind={props.ind} current_block='image' deleteBlock={props.deleteBlock} />
        <form className="container-fluid" name="submit-image-form">
          <label className="mr-sm-2">Прикрепить изображение</label>
          <div className="input-group">
            <div className="input-group-prepend">
              <span className="input-group-text bg-primary text-white">Attach</span>
            </div>
            <div className="custom-file">
              <input type="file" className="custom-file-input"
                aria-describedby="inputGroupFileAddon01" name="image" onChange={(e) => { return props.submitImage(e.target.form, props.ind); }} />
              <label className="my-custom-file-label">Choose file</label>
            </div>
          </div>
          {props.value.map((image, ind) => (
            <div key={ind + 'd1'} className="mt-2 ml-1" style={{ display: 'inline-block' }}>
              <img alt="" key={ind + 'i1'} src={image} className="image-block-img" />
              <img alt="" key={ind + 'i2'} src={getBackend() + '/media/images/icons/close.png'} height="10px" width="10px" className="image-delete" onClick={() => props.deleteImage(props.ind, ind)} />
            </div>
          ))}
        </form>
      </div>
      <AddBlock ind={props.ind} addBlock={props.addBlock} />
    </div>
  )
}

class TextBlock extends Component {
  divarea = React.createRef();

  render() {
    return (
      <div className="container-fluid pl-0">
        <div className="d-flex flex-row-reverse container-fluid pr-0">
          <ChooseBlock sendMessage={this.props.sendMessage} handleChangeType={this.props.handleChangeType} ind={this.props.ind} current_block='text' deleteBlock={this.props.deleteBlock} />
          <textarea placeholder="Написать текст" className="p-1 container-fluid mr-2 font-16" value={this.props.value} onKeyUp={(e) => textarea_resize(e, 24, 3)} onChange={(e) => this.props.handleChange(e, this.props.ind)} />
        </div>
        <AddBlock ind={this.props.ind} addBlock={this.props.addBlock} />
      </div>
    )
  }
}

class CreateMessage extends Component {
  getCode = (ind, _code, _style, _lang) => {
    const code = _code.value;
    const style = _style.value;
    const lang = _lang.value;
    const id = (new Date()).toISOString().replace(/[:.-]/g, () => '');

    fetch(getBackend() + '/upload_code/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: JSON.stringify({
        ind: id,
        code: code,
        style: style,
        lang: lang
      })
    }).then(res => res.json())
      .then(res => {
        const struct = this.props.struct;
        struct[ind].value = {
          code: res.code,
          css: res.css
        }
        this.props.setStruct(struct);
      })
  }

  handleChangeType = (ind, type) => {
    const struct = this.props.struct;
    struct[ind].type = type;
    switch (type) {
      case 'text':
        struct[ind].value = '';
        break;
      case 'image':
        struct[ind].value = [];
        break;
      case 'code':
        struct[ind].value = { code: '', css: '' };
        break;
      default:
        return '';
    }
    this.props.setStruct(struct);;
  }

  handleChange = (e, ind) => {
    const struct = this.props.struct;
    struct[ind].value = e.target.value;
    this.props.setStruct(struct);;
  }

  changeStyle = (e, ind) => {
    const struct = this.props.struct;
    struct[ind].style = e.target.value;
    this.props.setStruct(struct);;
  }

  submitImage = (form, ind) => {
    let formData = new FormData(form);
    fetch(getBackend() + '/upload_image/', {
      method: 'POST',
      headers: {
        Authorization: `JWT ${getCookie('token')}`
      },
      body: formData
    })
      .then(res => {
        if (res.status === 200 || res.status === 400)
          res.json()
            .then(json => {
              const struct = this.props.struct;
              if (json !== 'Type error') {
                struct[ind].value.push(getBackend() + '/media/' + json);
                this.props.setStruct(struct);;
              }
              else alert('Некорректный тип файла')
            });
        else if (res.status === 401)
          this.props.setError(401);
        else {
          alert('Ошибка загрузки');
        }
      })

    return false;
  }

  addBlock = (ind) => {
    const struct = this.props.struct;
    struct.splice(ind + 1, 0, { type: 'text', value: '' });
    this.props.setStruct(struct);;
  }

  deleteBlock = (ind) => {
    const struct = this.props.struct;
    struct.splice(ind, 1);
    this.props.setStruct(struct);;
  }

  deleteImage = (ind, img_ind) => {
    let struct = this.props.struct;
    struct[ind].value.splice(img_ind, 1);
    this.props.setStruct(struct);
  }

  sendMessage = () => this.props.sendMessage(this.props.type);

  render() {
    return (
      this.props.struct.map((block, ind) => {
        switch (block.type) {
          case 'text':
            return <TextBlock sendMessage={this.sendMessage} deleteBlock={this.deleteBlock} key={ind} value={block.value} ind={ind} handleChange={this.handleChange} handleChangeType={this.handleChangeType} addBlock={this.addBlock} />
          case 'image':
            return <ImageBlock sendMessage={this.sendMessage} deleteBlock={this.deleteBlock} key={ind} value={block.value} ind={ind} submitImage={this.submitImage} handleChangeType={this.handleChangeType} deleteImage={this.deleteImage} addBlock={this.addBlock} />
          case 'code':
            return <CodeBlock sendMessage={this.sendMessage} getCode={this.getCode} deleteBlock={this.deleteBlock} key={ind} value={block.value} ind={ind} submitImage={this.submitImage} handleChangeType={this.handleChangeType} addBlock={this.addBlock} />
          default:
            return '';
        }
      }
      )
    )
  }
}

export default CreateMessage;