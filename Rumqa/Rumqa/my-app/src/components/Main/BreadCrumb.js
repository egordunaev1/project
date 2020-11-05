import React from 'react';
import { Link } from "react-router-dom";

function BreadCrumb(props) {
  let path = props.location.pathname.split('/').filter(el => (el !== ''));
  let links = [[path[0], path[0]]];
  for (let i = 1; i < path.length; i++)
    links.push([path[i], links[i - 1][1] + '/' + path[i]]);
  return (
    <nav aria-label="breadcrumb" className="d-flex container-fluid p-0 bg-white">
      <ol className="breadcrumb mb-0 bg-white p-2">
        {links.map((link, ind) => (
          <li key={ind + 'li'} className={"breadcrumb-item" + (ind === links.length - 1 ? ' active' : '')}>
            {ind === links.length - 1 ? link[0] :
              <Link key={ind + "lnk"} to={'/' + link[1]}>
                {link[0]}
              </Link>
            }
          </li>
        ))}
      </ol>
      {
        props.can_edit && (
          props.active_tab > 4 ?
          <div className="ml-auto my-auto mr-2">
            <a href=" " onClick={(e) => {e.preventDefault(); return props.switchActiveTab(0, 1);}}>Назад</a>
          </div>
          :
          <div className="ml-auto my-auto mr-1">
            <button className="btn-sm btn-primary" onClick={() => props.switchActiveTab(0, 6)}>Редактировать</button>
          </div>
        )
      }
    </nav>
  );
}

export default BreadCrumb;