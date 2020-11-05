import React from 'react';

function NavTab(props) {
  let active_tab = props.active_tab;
  let tab_num = props.tab_num;
  let switchAT = props.switchActiveTab;
  return (
    <li className="nav-item">
      <div className={"nav-link" + (active_tab === tab_num ? ' active' : ' text-primary ')} onClick={(e) => switchAT(e, tab_num)}>
        {props.children}
      </div>
    </li>
  )
}

function Navigation(props) {
  return (
    <div className="bg-white">
      <ul className="nav nav-pills nav-fill">
        <NavTab active_tab={props.active_tab} tab_num={1} switchActiveTab={props.switchActiveTab}>Вложенные</NavTab>
        <NavTab active_tab={props.active_tab} tab_num={2} switchActiveTab={props.switchActiveTab}>Вопросник</NavTab>
        <NavTab active_tab={props.active_tab} tab_num={3} switchActiveTab={props.switchActiveTab}>Чат</NavTab>
        <NavTab active_tab={props.active_tab} tab_num={4} switchActiveTab={props.switchActiveTab}>Участники</NavTab>
      </ul>
    </div>
  )
}

export default Navigation;