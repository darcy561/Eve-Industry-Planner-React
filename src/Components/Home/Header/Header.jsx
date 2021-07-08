import React from 'react';
import{NavLink} from 'react-router-dom';

const Header = () => {

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
                    </div>
                </nav>
            </section>
        </>
    );
};


export { Header }