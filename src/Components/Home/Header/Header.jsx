import React from 'react';
import{Link} from 'react-router-dom';

const Header = () => {

    return (
        <>
            <section className="headerContainer">
                <header className="header">
                    <Link to="/home">
                    <h1>Eve Industry Planner</h1>
                    </Link>
                </header>
                <nav className="navbar">
                    <div className="navlinks">
                        <Link to="/jobplanner">
                        <li>Job Planner</li>
                        </Link>
                        <Link to="/itemtree">
                        <li>Item Tree</li>
                        </Link>
                    </div>
                </nav>
            </section>
        </>
    );
}


export { Header }