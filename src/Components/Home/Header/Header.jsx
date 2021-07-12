import React from 'react';
import{NavLink} from 'react-router-dom';
import { login } from '../../Auth/Auth-Login';

function Header(){

    return (
        <>
            <section className="headerContainer">
                <header className="header">
                    <NavLink to="/home" className="headerLink" >
                        <h1>Eve Industry Planner</h1>
                    </NavLink>
                </header>
                <nav className="navbar"  >
                    <div className="navlinks">
                        <NavLink to="/jobplanner" className="navlinkOption" activeClassName="navlinkOptionActive">
                            Job Planner
                        </NavLink>
                        <NavLink to="/itemtree" className="navlinkOption" activeClassName="navlinkOptionActive">
                            Item Tree
                        </NavLink>
                        {/* <li className="navlinkOption" activeClassName="navlinkOptionActive" onClick={() => {
                            login()
                        }}>Login</li> */}
                    </div>
                </nav>
            </section>
        </>
    );
};


export { Header }